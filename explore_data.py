import re
from collections import Counter

def explore():
    with open("extracted_text.txt", "r", encoding="utf-8") as f:
        content = f.read()
    
    pages = content.split("--- PAGE ")
    print(f"Total sections split by PAGE: {len(pages)}")
    
    event_whens = Counter()
    event_names = Counter()
    locations = Counter()
    states = Counter()
    divisions = Counter()
    
    # Let's inspect a few page headers
    print("\n--- SAMPLE PAGE HEADERS ---")
    for idx, page in enumerate(pages[1:15]): # Skip page 0 (split header)
        lines = [l.strip() for l in page.split("\n") if l.strip()]
        if not lines:
            continue
        print(f"Page {idx+1} (starts with line '{lines[0]}'):")
        # print first 8 lines
        for l in lines[:8]:
            print(f"  {l}")
        print("-" * 30)

    # Let's search for events and locations
    for page in pages[1:]:
        lines = [l.strip() for l in page.split("\n") if l.strip()]
        if not lines:
            continue
        
        # Look for "Event When:"
        when_val = "Unknown"
        event_name = "Unknown"
        location = "Unknown"
        
        for i, line in enumerate(lines[:10]):
            if "Event When:" in line:
                when_val = line.replace("Event When:", "").strip()
                # Next line might be the time range
                if i + 1 < len(lines) and re.match(r'^\d+:\d+', lines[i+1]):
                    when_val += " " + lines[i+1]
            if "Event Schedule" in line:
                # The event name is usually the next line or lines
                # and ends before "PresentationArrival Location:" or "Arrival Location:"
                event_lines = []
                j = i + 1
                while j < len(lines) and "Location:" not in lines[j] and "Registration" not in lines[j]:
                    event_lines.append(lines[j])
                    j += 1
                event_name = " ".join(event_lines).strip()
            if "Location:" in line:
                # Location is after Location:
                m = re.search(r'Location:\s*(.*)', line)
                if m:
                    location = m.group(1).strip()
        
        event_whens[when_val] += 1
        event_names[event_name] += 1
        locations[location] += 1
        
        # Look for state patterns
        for line in lines:
            match = re.search(r'\b([A-Za-z\s]+)\s+(HS|MS)\b', line)
            if match:
                states[match.group(1).strip()] += 1
                divisions[match.group(2).strip()] += 1

    print("\n--- EVENT WHENS ---")
    for k, v in event_whens.most_common(10):
        print(f"  {k}: {v} pages")
        
    print("\n--- TOP EVENTS ---")
    for k, v in event_names.most_common(10):
        print(f"  {k}: {v} pages")
        
    print("\n--- TOP LOCATIONS ---")
    for k, v in locations.most_common(10):
        print(f"  {k}: {v} pages")
        
    print("\n--- DIVISIONS ---")
    for k, v in divisions.items():
        print(f"  {k}: {v} matches")
        
    print("\n--- TOP STATES ---")
    for k, v in states.most_common(10):
        print(f"  {k}: {v} matches")

if __name__ == "__main__":
    explore()
