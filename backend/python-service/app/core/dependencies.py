"""
FastAPI's Depends() is the framework's native DI mechanism — the closest
Python equivalent to Spring's @Autowired/constructor injection, and the
direct replacement for the Node backend's requireAuth/requireRole
middleware. Declared as a parameter default on a controller method
(e.g. `user: dict = Depends(require_role("admin"))`), FastAPI resolves it
before the handler body runs, exactly like an Express middleware running
before the route handler.
"""

from fastapi import Depends, Header

from app.core.errors import AppError
from app.core.security import decode_access_token


async def require_auth(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise AppError(401, "Missing bearer token")
    token = authorization[7:]
    try:
        payload = decode_access_token(token)
    except Exception:
        raise AppError(401, "Invalid or expired access token")
    return {"id": payload["sub"], "role": payload["role"]}


def require_role(*roles: str):
    async def checker(user: dict = Depends(require_auth)) -> dict:
        if user["role"] not in roles:
            raise AppError(403, "Insufficient permissions")
        return user

    return checker
