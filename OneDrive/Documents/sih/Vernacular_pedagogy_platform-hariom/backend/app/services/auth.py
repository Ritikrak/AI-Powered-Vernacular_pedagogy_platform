from datetime import datetime, timedelta, timezone

from jose import jwt

from ..config import get_settings

ALGORITHM = "HS256"


def create_access_token(subject: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(hours=8)
    return jwt.encode({"sub": subject, "exp": expires}, get_settings().secret_key, algorithm=ALGORITHM)
