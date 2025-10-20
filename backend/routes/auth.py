from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from email.mime.text import MIMEText
import os, smtplib, sqlite3, random, string, datetime

router = APIRouter()

# DB
DB_PATH = os.environ.get("DB_PATH", "/data/EventPlannerDB.db")

def get_connection():
    con = sqlite3.connect(DB_PATH, timeout=15, check_same_thread=False)
    con.execute("PRAGMA journal_mode=WAL;")
    return con

#
# Mailtrap configuration (hardcoded for dev)
SMTP_HOST = "send.smtp.mailtrap.io"
SMTP_PORT = 587
SMTP_USER = "api"
SMTP_PASS = "336e403b8d0b431c09af7b7615405303"
FROM_EMAIL = "verify@cs350unco.com"
DEV_ECHO = False
print(f"[Mailtrap Config] Host={SMTP_HOST}, Port={SMTP_PORT}, User={SMTP_USER}, From={FROM_EMAIL}")

# Pending verifications (dev-only memory store)
pending_verifications: dict[str, dict] = {}

class RegisterRequest(BaseModel):
    email: str
    password: str
    accountType: str  # "Student" | "Faculty"

class VerifyRequest(BaseModel):
    email: str
    code: str

@router.post("/register")
def register(req: RegisterRequest):
    email = req.email.strip()
    if req.accountType not in ("Student", "Faculty"):
        raise HTTPException(status_code=400, detail="Invalid account type")

    # prevent duplicates (existing verified accounts)
    with get_connection() as con:
        cur = con.cursor()
        cur.execute("SELECT 1 FROM accounts WHERE email = ?", (email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Email already exists")

    code = "".join(random.choices(string.digits, k=6))
    expiry = (datetime.datetime.now() + datetime.timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S")

    pending_verifications[email] = {
        "email": email,
        "password": req.password,  # TODO: hash before storing in prod
        "accountType": req.accountType,
        "code": code,
        "expiry": expiry,
    }

    # Dev echo or missing creds => bypass SMTP and return code
    if DEV_ECHO or not (SMTP_USER and SMTP_PASS and FROM_EMAIL):
        print(f"[DEV_EMAIL_ECHO] to={email} code={code}")
        return {"message": "Verification email 'sent' (dev)", "dev_code": code}

    # Real SMTP send
    try:
        msg = MIMEText(f"Your UNCO Event App verification code is: {code}")
        msg["Subject"] = "UNCO Event App Verification Code"
        msg["From"] = FROM_EMAIL
        msg["To"] = email

        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
    except Exception as e:
        pending_verifications.pop(email, None)
        raise HTTPException(status_code=500, detail=f"Email failed: {str(e)}")

    return {"message": "Verification email sent"}

@router.post("/verify")
def verify(req: VerifyRequest):
    email = req.email.strip()
    data = pending_verifications.get(email)
    if not data:
        raise HTTPException(status_code=404, detail="No pending verification")
    if data["code"] != req.code.strip():
        raise HTTPException(status_code=400, detail="Invalid verification code")
    if datetime.datetime.strptime(data["expiry"], "%Y-%m-%d %H:%M:%S") < datetime.datetime.now():
        pending_verifications.pop(email, None)
        raise HTTPException(status_code=400, detail="Code expired")

    # Insert AFTER verification
    try:
        with get_connection() as con:
            cur = con.cursor()
            cur.execute("SELECT MAX(accountID) FROM accounts")
            row = cur.fetchone()
            new_id = 0 if row[0] is None else int(row[0]) + 1
            cur.execute(
                """
                INSERT INTO accounts (accountID, accountType, email, password, isVerified, verificationCode, verificationExpiry)
                VALUES (?, ?, ?, ?, 1, ?, ?)
                """,
                (new_id, data["accountType"], data["email"], data["password"], data["code"], data["expiry"]),
            )
            con.commit()
    except sqlite3.IntegrityError:
        pending_verifications.pop(email, None)
        raise HTTPException(status_code=400, detail="Email already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        pending_verifications.pop(email, None)

    return {"message": "Account verified and created", "accountID": new_id}