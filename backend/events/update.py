import os
import sqlite3
import base64
from typing import Optional

"""
=========================================================
UPDATE EVENT (mirror of create.py logic, modifies existing rows)
=========================================================

Purpose:
- Updates existing events using the same structure and validation logic as create_event.
- Properly decodes and stores image BLOBs.
- Preserves authorization logic and allowed field rules.
"""

# -----------------------------
# DATABASE PATH
# -----------------------------
DB_PATH = os.environ.get("DB_PATH", "/data/EventPlannerDB.db")

ALLOWED_EVENT_TYPES = {
    "Art", "Math", "Science", "Computer Science", "History",
    "Education", "Political Science", "Software Engineering",
    "Business", "Sports", "Honors", "Workshops",
    "Study Session", "Dissertation", "Performance", "Competition"
}
ALLOWED_ACCESS = {"Public", "Private"}

def _get_conn():
    conn = sqlite3.connect(DB_PATH, timeout=15, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def _is_authorized(updater_id: int, event_creator_id: int) -> bool:
    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT accountType FROM accounts WHERE accountID = ?", (updater_id,))
        row = cur.fetchone()
        if not row:
            return False
        return updater_id == event_creator_id or row[0] == "Faculty"


def update_event(
    event_id: int,
    updater_id: int,
    eventName: Optional[str] = None,
    eventDescription: Optional[str] = None,
    location: Optional[str] = None,
    eventType: Optional[str] = None,
    startDateTime: Optional[str] = None,
    eventAccess: Optional[str] = None,
    images: Optional[bytes] = None,
    rsvpRequired: Optional[int] = None,
    isPriced: Optional[int] = None,
    cost: Optional[float] = None,
) -> bool:
    """
    Update an existing event using the same logic as create_event.
    Returns True if successful, False otherwise.
    """

    if eventType and eventType not in ALLOWED_EVENT_TYPES:
        raise ValueError(f"eventType must be one of: {sorted(ALLOWED_EVENT_TYPES)}")
    if eventAccess and eventAccess not in ALLOWED_ACCESS:
        raise ValueError(f"eventAccess must be one of: {sorted(ALLOWED_ACCESS)}")

    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute("SELECT creatorID FROM events WHERE eventID = ?", (event_id,))
        row = cur.fetchone()
        if not row:
            return False
        creator_id = row[0]

        if not _is_authorized(updater_id, creator_id):
            return False

        updates = {}
        if eventName is not None:
            updates["eventName"] = eventName
        if eventDescription is not None:
            updates["eventDescription"] = eventDescription
        if location is not None:
            updates["location"] = location
        if eventType is not None:
            updates["eventType"] = eventType
        if startDateTime is not None:
            updates["startDateTime"] = startDateTime
        if eventAccess is not None:
            updates["eventAccess"] = eventAccess

        # Image handling identical to create.py, with safer base64 and byte support
        if images is not None:
            try:
                if isinstance(images, str):
                    if images.startswith("data:image"):
                        images = images.split(",", 1)[1]
                    images = base64.b64decode(images)
                    print(f"[DEBUG] Decoded base64 image for event {event_id}, {len(images)} bytes")
                elif isinstance(images, (bytes, bytearray)):
                    print(f"[DEBUG] Using raw image bytes for event {event_id}, {len(images)} bytes")
                else:
                    print(f"[WARN] Unsupported image format for event {event_id}: {type(images)}")
                    images = None
            except Exception as e:
                print(f"[ERROR] Image decode failed for event {event_id}: {e}")
                images = None

            if images:
                updates["images"] = images

        if rsvpRequired is not None:
            updates["rsvpRequired"] = int(rsvpRequired)
        if isPriced is not None:
            updates["isPriced"] = int(isPriced)
        if cost is not None:
            updates["cost"] = cost

        if not updates:
            return False

        set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
        params = list(updates.values()) + [event_id]
        cur.execute(f"UPDATE events SET {set_clause} WHERE eventID = ?", params)
        conn.commit()
        return cur.rowcount > 0