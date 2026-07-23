# This module defines dependencies for FastAPI routes, including 
# authentication and role-based access control.

from fastapi import Depends, Header

from app.core.errors import AppError
from app.core.security import decode_access_token

# require_auth is a dependency that checks for a valid Bearer token in the
async def require_auth(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise AppError(401, "Missing bearer token")
    token = authorization[7:]
    try:
        payload = decode_access_token(token)
    except Exception:
        raise AppError(401, "Invalid or expired access token")
    return {"id": payload["sub"], "role": payload["role"]}

# require_role is a dependency factory that checks if the authenticated user
def require_role(*roles: str):
    async def checker(user: dict = Depends(require_auth)) -> dict:
        if user["role"] not in roles:
            raise AppError(403, "Insufficient permissions")
        return user

    return checker
