import re
import json

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
    
    # Capture section details if any
    section = "Main"
    sec_match = re.search(r"Section\s*(\d+)", name, re.IGNORECASE)
    if sec_match:
        section = f"Section {sec_match.group(1)}"
    elif "objective" in name.lower():
        section = "Objective Test"
    
    # Clean the name
    cleaned = re.sub(r"\s*-\s*Prelim(?:s)?\s*-\s*Section\s*\d+\s*-\s*Presentation", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*-\s*Prelim(?:s)?\s*-\s*Section\s*\d+", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*-\s*Section\s*\d+", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*-\s*Prelim(?:s)?", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*-\s*Objective(?:\s*Test)?", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*-\s*Presentation", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*-\s*Performance", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*-\s*$", "", cleaned)
    
    cleaned = cleaned.strip(" -")
    return cleaned, section

def parse_schedules():
    with open("extracted_text.txt", "r", encoding="utf-8") as f:
        content = f.read()
    
    pages = content.split("--- PAGE ")
    parsed_entries = []
    
    state_re = re.compile(r'^([A-Za-z\s]+)\s+(HS|MS)$')
    time_re = re.compile(r'\b(\d{1,2}:\d{2}\s*(?:AM|PM))\b', re.IGNORECASE)
    
    for page_idx, page in enumerate(pages[1:], start=1):
        lines = [l.strip() for l in page.split("\n")]
        lines = [l for l in lines if l]
        if not lines:
            continue
            
        event_when = "Unknown"
        event_time_range = "Unknown"
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
                            if parts[0].strip() and parts[0].strip() not in event_name:
                                event_name = (event_name + " " + parts[0].strip()).strip()
                    elif "Location:" in loc_line:
                        parts = loc_line.split("Location:")
                        event_location = parts[1].strip()
                        if parts[0].strip() and parts[0].strip() not in event_name:
                            event_name = (event_name + " " + parts[0].strip()).strip()
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
            
    print(f"Total parsed entries: {len(parsed_entries)}")
    
    # Write to data.json
    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(parsed_entries, f, indent=2)
    print("Saved to data.json")

if __name__ == "__main__":
    parse_schedules()
