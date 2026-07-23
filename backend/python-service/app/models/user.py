from datetime import datetime, timezone
from typing import Literal, Optional

from beanie import Document
from pydantic import EmailStr, Field
from pymongo import IndexModel

# User roles: admin has full control, including user management; 
# manager works with resources and initiatives.
class User(Document):
    """Login accounts. Two roles: admin (full control,
    including user management) and manager (works with resources and
    initiatives)."""

    email: EmailStr
    password_hash: str
    role: Literal["admin", "manager"] = "manager"
    resource_id: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
        indexes = [IndexModel("email", unique=True)]
