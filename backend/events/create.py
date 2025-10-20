import os
import sqlite3
from typing import Optional

# DB path: backend/db/EventPlannerDB.db
DB_PATH = os.environ.get("DB_PATH", "/data/EventPlannerDB.db")

ALLOWED_EVENT_TYPES = {
    "Art", "Math", "Science", "Computer Science", "History",
    "Education", "Political Science", "Software Engineering",
    "Business", "Sports", "Honors", "Workshops",
    "Study Session", "Dissertation", "Performance", "Competition"
}
ALLOWED_ACCESS = {"Public", "Private"}

def create_event(
    creatorID: int,
    eventName: str,
    eventDescription: str,
    location: str,
    eventType: str,
    startDateTime: str,                # "YYYY-MM-DD HH:MM:SS"
    eventAccess: str = "Public",
    images: Optional[bytes] = None,
    rsvpRequired: int = 0,
    isPriced: int = 0,
    cost: Optional[float] = None,
) -> int:
    if eventType not in ALLOWED_EVENT_TYPES:
        raise ValueError(f"eventType must be one of: {sorted(ALLOWED_EVENT_TYPES)}")
    if eventAccess not in ALLOWED_ACCESS:
        raise ValueError(f"eventAccess must be one of: {sorted(ALLOWED_ACCESS)}")

    with sqlite3.connect(DB_PATH, timeout=15, check_same_thread=False) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        cur = conn.cursor()
        creatorID = int(creatorID)
        print("DEBUG: inserting event with creatorID =", creatorID)
        cur.execute("""
            INSERT INTO events (
                creatorID, eventName, eventDescription, location, images,
                eventType, eventAccess, startDateTime,
                numberLikes, rsvpRequired, isPriced, cost
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
        """, (
            creatorID, eventName, eventDescription, location, images,
            eventType, eventAccess, startDateTime,
            rsvpRequired, isPriced, cost
        ))
        conn.commit()
        return cur.lastrowid

if __name__ == "__main__":
    new_id = create_event(
        creatorID=1,
        eventName="Backend Test Event",
        eventDescription="Created without endDateTime",
        location="Library Room 210",
        eventType="Workshops",
        startDateTime="2025-10-15 14:00:00",
    )
    print(f"New event created with ID: {new_id}")