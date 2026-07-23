# This module provides security-related functions for password hashing, 
# token signing, and verification.

import hashlib
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def hash_token(token: str) -> str:
    # Same rationale as the Node backend: refresh tokens are stored hashed,
    # never raw, so a DB leak alone doesn't hand out usable refresh tokens.
    return hashlib.sha256(token.encode()).hexdigest()


def sign_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_ttl_minutes)
    return jwt.encode({"sub": user_id, "role": role, "exp": expire}, settings.jwt_access_secret, algorithm="HS256")


def sign_refresh_token(user_id: str) -> tuple[str, datetime]:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_ttl_days)
    token = jwt.encode({"sub": user_id, "exp": expire}, settings.jwt_refresh_secret, algorithm="HS256")
    return token, expire


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_access_secret, algorithms=["HS256"])


def decode_refresh_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_refresh_secret, algorithms=["HS256"])
