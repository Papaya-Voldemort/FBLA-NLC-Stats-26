import re
import json

def clean_event_name(name):
    cleaned = name
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
    cleaned = cleaned.strip(" -")
    
    if "Digital Design" in cleaned and "Case" in cleaned:
        cleaned = "Digital Design & Communications Case Competition"
        
    return cleaned

def test_parse():
    with open("scratch/collegiate_winners.txt", "r", encoding="utf-8") as f:
        content = f.read()
        
    pages = content.split("--- PAGE ")
    print(f"Total pages: {len(pages) - 1}")
    
    parsed_events = {}
    
    rank_re = re.compile(r'^(\d+)\s+(.+)$')
    state_re = re.compile(r'^([A-Za-z\s\–\-]+)\s+(Collegiate|HS|MS)$')
    
    for page_idx, page in enumerate(pages[1:], start=1):
        lines = [l.strip() for l in page.split("\n")]
        lines = [l for l in lines if l]
        if not lines:
            continue
            
        # Find Results header
        results_idx = -1
        for i, line in enumerate(lines[:5]):
            if line == "Results":
                results_idx = i
                break
                
        if results_idx == -1:
            print(f"Warning: Page {page_idx} does not have 'Results' header.")
            continue
            
        # Event name might wrap onto the next line! E.g.
        # Digital Design & Communications Case Competition -
        # Final
        # Let's read lines from results_idx + 1 up to Page X of Y line and join them!
        event_name_parts = []
        k = results_idx + 1
        while k < len(lines) and not re.match(r'^Page\s+\d+\s+of\s+\d+$', lines[k]):
            event_name_parts.append(lines[k])
            k += 1
        
        event_name_raw = " ".join(event_name_parts).strip()
        event_name = clean_event_name(event_name_raw)
        
        # Find Finish index
        finish_idx = -1
        for i, line in enumerate(lines):
            if line == "Finish":
                finish_idx = i
                break
                
        if finish_idx == -1:
            print(f"Warning: Page {page_idx} does not have 'Finish' header.")
            continue
            
        winners = []
        
        # Loop through lines starting from finish_idx + 1
        current_winner = None
        j = finish_idx + 1
        while j < len(lines):
            line = lines[j]
            
            # Check if this is a rank line
            rank_match = rank_re.match(line)
            if rank_match:
                # Save previous winner if any
                if current_winner:
                    winners.append(current_winner)
                    
                rank_val = int(rank_match.group(1))
                school_name = rank_match.group(2).strip()
                
                # Check next line
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
                        # Try appending next_line to school name and check the line after that
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
                                print(f"Warning: Page {page_idx} rank {rank_val} double missing state line. Next_next_line: {next_next_line}")
                                current_winner = None
                        else:
                            print(f"Warning: Page {page_idx} rank {rank_val} missing state line at end of page.")
                            current_winner = None
                else:
                    current_winner = None
            else:
                # It's a competitor name (if we have current_winner)
                if current_winner:
                    # Ignore standard PDF footer text that might slip in
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
        
    print(f"Successfully parsed {len(parsed_events)} events.")
    # Show first event sample
    first_event = list(parsed_events.keys())[0]
    print(f"\nSample Event: {first_event}")
    print(json.dumps(parsed_events[first_event][:3], indent=2))

if __name__ == "__main__":
    test_parse()
