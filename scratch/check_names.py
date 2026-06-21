import json

def check():
    with open("public/data/collegiate/2026/schedules.json") as f:
        schedules = json.load(f)
    with open("public/data/collegiate/2026/winners.json") as f:
        winners = json.load(f)
        
    sched_events = set(e["event_name"] for e in schedules)
    winner_events = set(winners.keys())
    
    print("Events in schedules:", len(sched_events))
    print("Events in winners:", len(winner_events))
    
    print("\nWinners events not in schedules:")
    for w in sorted(winner_events):
        if w not in sched_events:
            print(f"  {w}")
            
    print("\nSchedules events not in winners:")
    for s in sorted(sched_events):
        if s not in winner_events:
            print(f"  {s}")

if __name__ == "__main__":
    check()
