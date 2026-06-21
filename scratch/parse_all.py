import re
import json
import os

VALID_STATES = {
    'Alabama', 'Arizona', 'Arkansas', 'California', 'Canada', 'Colorado', 'Connecticut', 
    'District of Columbia', 'Florida', 'Georgia', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 
    'Kentucky', 'Louisiana', 'Maryland', 'Massachusetts', 'Michigan', 'Mississippi', 
    'Missouri', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New York', 
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 
    'Puerto Rico', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 
    'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
}

def clean_event_name(name):
    cleaned = name
    section = "Main"
    sec_match = re.search(r"Section\s*(\d+)", name, re.IGNORECASE)
    if sec_match:
        section = f"Section {sec_match.group(1)}"
    elif "objective" in name.lower():
        section = "Objective Test"
    
    cleaned = re.sub(r"\s*-\s*Final\s*$", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*-\s*Prelim(?:s)?\s*-\s*Section\s*\d+\s*-\s*Presentation", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*-\s*Prelim(?:s)?\s*-\s*Section\s*\d+", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*-\s*Section\s*\d+", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*-\s*Prelim(?:s)?", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*-\s*Objective(?:\s*Test)?", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*-\s*Presentation", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*-\s*Performance", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*-\s*Production\s*$", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*-\s*Customer(?:\s*Service)?\s*$", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*-\s*$", "", cleaned)
    
    cleaned = cleaned.strip(" -")
    
    if "Digital Design" in cleaned and "Case" in cleaned:
        cleaned = "Digital Design & Communications Case Competition"
        
    return cleaned, section

def parse_schedules(txt_path, output_json_path, division_pattern):
    with open(txt_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    pages = content.split("--- PAGE ")
    parsed_entries = []
    
    state_re = re.compile(rf'^([A-Za-z\s]+)\s+({division_pattern})$')
    time_re = re.compile(r'\b(\d{1,2}:\d{2}\s*(?:AM|PM))\b', re.IGNORECASE)
    
    for page_idx, page in enumerate(pages[1:], start=1):
        lines = [l.strip() for l in page.split("\n")]
        lines = [l for l in lines if l]
        if not lines:
            continue
            
        event_when = "Unknown"
        event_name = "Unknown"
        event_location = "Unknown"
        
        header_end_idx = 0
        for i, line in enumerate(lines[:12]):
            if "Event When:" in line:
                event_when = line.replace("Event When:", "").strip()
            elif "Event Schedule" in line:
                name_parts = []
                j = i + 1
                while j < len(lines) and "Registration" not in lines[j] and "Location:" not in lines[j]:
                    name_parts.append(lines[j])
                    j += 1
                event_name = " ".join(name_parts).strip()
                
                if j < len(lines) and "Location:" in lines[j]:
                    loc_line = lines[j]
                    if "Arrival Location:" in loc_line:
                        parts = loc_line.split("Arrival Location:")
                        if len(parts) > 1:
                            event_location = parts[1].strip()
                            if event_location == "??":
                                event_location = "Pavilion 7"
                            val = parts[0].strip()
                            if val and (val not in event_name or (val.lower() == "service" and event_name.rstrip(" -").endswith("Customer"))):
                                event_name = (event_name + " " + val).strip()
                    elif "Location:" in loc_line:
                        parts = loc_line.split("Location:")
                        event_location = parts[1].strip()
                        if event_location == "??":
                            event_location = "Pavilion 7"
                        val = parts[0].strip()
                        if val and (val not in event_name or (val.lower() == "service" and event_name.rstrip(" -").endswith("Customer"))):
                            event_name = (event_name + " " + val).strip()
                header_end_idx = max(header_end_idx, j)
            elif "Arrival Time" in line:
                header_end_idx = max(header_end_idx, i)
        
        # Clean event name
        raw_event_name = event_name
        event_name, section_name = clean_event_name(raw_event_name)
        
        state_indices = []
        for idx, line in enumerate(lines):
            if idx <= header_end_idx:
                continue
            match = state_re.match(line)
            if match:
                st_name = match.group(1).strip()
                if st_name in VALID_STATES:
                    state_indices.append(idx)
                
        for i, state_idx in enumerate(state_indices):
            school_idx = state_idx - 1
            if school_idx < 0:
                continue
            school_name = lines[school_idx]
            
            state_match = state_re.match(lines[state_idx])
            state_name = state_match.group(1).strip()
            division = state_match.group(2).strip()
            
            next_school_idx = state_indices[i+1] - 1 if i + 1 < len(state_indices) else len(lines)
            raw_detail_lines = lines[state_idx + 1 : next_school_idx]
            
            competitors = []
            arrival_time = None
            
            for d_line in raw_detail_lines:
                d_line_clean = d_line.strip()
                if not d_line_clean or d_line_clean == "BREAK":
                    continue
                
                t_match = time_re.search(d_line_clean)
                if t_match:
                    arrival_time = t_match.group(1).strip()
                    name_part = d_line_clean.replace(arrival_time, "").strip()
                    if name_part:
                        competitors.append(name_part)
                else:
                    if "Generated by Blue Panda" in d_line_clean or "2026 NLC Registration" in d_line_clean or "Arrival Time" in d_line_clean:
                        continue
                    competitors.append(d_line_clean)
            
            parsed_entries.append({
                "page": page_idx,
                "raw_event_name": raw_event_name,
                "event_name": event_name,
                "section_name": section_name,
                "event_when": event_when,
                "event_location": event_location,
                "school_name": school_name,
                "state": state_name,
                "division": division,
                "competitors": competitors,
                "arrival_time": arrival_time,
                "team_size": len(competitors)
            })
            
    print(f"Parsed {len(parsed_entries)} schedule entries from {txt_path}.")
    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(parsed_entries, f, indent=2)
    print(f"Saved schedules to {output_json_path}")

def parse_winners(txt_path, output_json_path):
    with open(txt_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    pages = content.split("--- PAGE ")
    parsed_events = {}
    
    rank_re = re.compile(r'^(\d+)\s+(.+)$')
    state_re = re.compile(r'^([A-Za-z\s\–\-]+)\s+(Collegiate|HS|MS)$')
    
    for page_idx, page in enumerate(pages[1:], start=1):
        lines = [l.strip() for l in page.split("\n")]
        lines = [l for l in lines if l]
        if not lines:
            continue
            
        results_idx = -1
        for i, line in enumerate(lines[:5]):
            if line == "Results":
                results_idx = i
                break
                
        if results_idx == -1:
            continue
            
        event_name_parts = []
        k = results_idx + 1
        while k < len(lines) and not re.match(r'^Page\s+\d+\s+of\s+\d+$', lines[k]):
            event_name_parts.append(lines[k])
            k += 1
        
        event_name_raw = " ".join(event_name_parts).strip()
        event_name, _ = clean_event_name(event_name_raw)
        
        finish_idx = -1
        for i, line in enumerate(lines):
            if line == "Finish":
                finish_idx = i
                break
                
        if finish_idx == -1:
            continue
            
        winners = []
        current_winner = None
        j = finish_idx + 1
        while j < len(lines):
            line = lines[j]
            rank_match = rank_re.match(line)
            if rank_match:
                if current_winner:
                    winners.append(current_winner)
                    
                rank_val = int(rank_match.group(1))
                school_name = rank_match.group(2).strip()
                
                if j + 1 < len(lines):
                    j += 1
                    next_line = lines[j]
                    state_match = state_re.match(next_line)
                    if state_match:
                        state_name = state_match.group(1).strip()
                        division = state_match.group(2).strip()
                        current_winner = {
                            "rank": rank_val,
                            "school_name": school_name,
                            "state": state_name,
                            "division": division,
                            "competitors": []
                        }
                    else:
                        school_name = f"{school_name} {next_line}".strip()
                        if j + 1 < len(lines):
                            j += 1
                            next_next_line = lines[j]
                            state_match = state_re.match(next_next_line)
                            if state_match:
                                state_name = state_match.group(1).strip()
                                division = state_match.group(2).strip()
                                current_winner = {
                                    "rank": rank_val,
                                    "school_name": school_name,
                                    "state": state_name,
                                    "division": division,
                                    "competitors": []
                                }
                else:
                    current_winner = None
            else:
                if current_winner:
                    if "Page " in line and " of " in line:
                        pass
                    elif "Results" in line:
                        pass
                    else:
                        current_winner["competitors"].append(line)
            j += 1
            
        if current_winner:
            winners.append(current_winner)
            
        parsed_events[event_name] = winners
        
    print(f"Parsed {len(parsed_events)} events with winners from {txt_path}.")
    os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(parsed_events, f, indent=2)
    print(f"Saved winners to {output_json_path}")

if __name__ == "__main__":
    # 1. Parse High School schedules
    parse_schedules(
        "scratch/high_school_schedules.txt", 
        "public/data/high-school/2026/schedules.json", 
        "HS|MS"
    )
    
    # 2. Parse Collegiate schedules
    parse_schedules(
        "scratch/collegiate_schedules.txt", 
        "public/data/collegiate/2026/schedules.json", 
        "Collegiate"
    )
    
    # 3. Parse Collegiate winners
    parse_winners(
        "scratch/collegiate_winners.txt", 
        "public/data/collegiate/2026/winners.json"
    )
