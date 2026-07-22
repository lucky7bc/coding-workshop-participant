from typing import Literal, Optional

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: Literal["admin", "manager"] = "manager"
    resource_id: Optional[int] = None
