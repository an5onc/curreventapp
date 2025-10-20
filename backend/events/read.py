import os
import sqlite3
import base64

"""
=========================================================
READ EVENTS (events table query)
=========================================================

Purpose:
- Provides functions to fetch events from the DB.
- Can fetch all events, a single event by ID, or a single field.

What Changed:
- Uses row_factory so results return as dicts, not tuples.
- Excludes 'Inactive' events by default (soft-deleted).
- Added chronological ordering option for better UI display.

Frontend Use:
- "Browse Events" page → call read_events() to populate event list.
- "Event Details" page → call read_event_by_id() with the eventID.
- Useful for both list views and detail views in frontend.
"""

# -----------------------------
# DATABASE PATH
# -----------------------------
DB_PATH = os.environ.get("DB_PATH", "/data/EventPlannerDB.db")

def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # return dict-like rows
    return conn

# -----------------------------
# READ FUNCTIONS
# -----------------------------
def read_events(include_inactive: bool = False, chronological: bool = True) -> list[dict]:
    """
    Return events as list of dicts.
    Excludes 'Inactive' events by default.
    Optionally sorts by startDateTime.
    Always includes base64-encoded imageUrl if present.
    """
    with _get_conn() as conn:
        cur = conn.cursor()
        base = """SELECT eventID, creatorID, eventName, eventDescription, location, images,
                         eventType, eventAccess, startDateTime, numberLikes, rsvpRequired, isPriced, cost
                  FROM events"""
        where = "" if include_inactive else " WHERE eventAccess != 'Inactive'"
        order = " ORDER BY startDateTime ASC" if chronological else ""
        cur.execute(base + where + order)
        results = [dict(r) for r in cur.fetchall()]
        for r in results:
            if r.get("images") is not None:
                try:
                    blob = r["images"]
                    if isinstance(blob, memoryview):
                        blob = blob.tobytes()
                    r["imageUrl"] = "data:image/jpeg;base64," + base64.b64encode(blob).decode("utf-8")
                except Exception as e:
                    print(f"Error encoding image for event {r.get('eventID', 'unknown')}: {e}")
                    r["imageUrl"] = None
            else:
                r["imageUrl"] = None
        return results

def read_event_by_id(eventID: int, include_inactive: bool = False) -> dict | None:
    """
    Fetch single event by ID.
    Excludes 'Inactive' events unless override=True.
    Always returns imageUrl if present.
    """
    with _get_conn() as conn:
        cur = conn.cursor()
        cur.execute("""SELECT eventID, creatorID, eventName, eventDescription, location, images,
                              eventType, eventAccess, startDateTime, numberLikes, rsvpRequired, isPriced, cost
                       FROM events WHERE eventID = ?""", (eventID,))
        row = cur.fetchone()
        if not row:
            return None
        row = dict(row)
        if not include_inactive and row.get("eventAccess") == "Inactive":
            return None
        if row.get("images") is not None:
            try:
                blob = row["images"]
                if isinstance(blob, memoryview):
                    blob = blob.tobytes()
                row["imageUrl"] = "data:image/jpeg;base64," + base64.b64encode(blob).decode("utf-8")
            except Exception as e:
                print(f"Error encoding image for event {row.get('eventID', 'unknown')}: {e}")
                row["imageUrl"] = None
        else:
            row["imageUrl"] = None
        return row

def read_event_field(eventID: int, field: str) -> object | None:
    """
    Convenience: return one field value for event.
    Returns None if event not found.
    """
    evt = read_event_by_id(eventID)
    return None if not evt else evt.get(field)

# -----------------------------
# DEBUG / LOCAL TESTING
# -----------------------------
if __name__ == "__main__":
    print(read_events())
    print(read_event_by_id(1))
    print(read_event_field(1, "eventName"))
