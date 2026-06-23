import json

def main():
    dest_path = "/Users/elinelson/Documents/Development/NLC_26_Breakdown/public/data/high-school/2026/workshops.json"
    with open(dest_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    for idx, w in enumerate(data[:15]):
        if "&" in w['presenter'] or "and" in w['presenter']:
            print(f"#{idx+1}")
            print(f"  TITLE: {w['title']}")
            print(f"  PRESENTER: {w['presenter']}")
            print(f"  ORGANIZATION: {w['organization']}")
            print("-" * 50)

if __name__ == "__main__":
    main()
