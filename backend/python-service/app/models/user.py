from datetime import datetime, timezone
from typing import Literal, Optional

from beanie import Document
from pydantic import EmailStr, Field
from pymongo import IndexModel


class User(Document):
    """Login accounts only — distinct from Resource, which is a tracked
    employee data record with no login. Two roles: admin (full control,
    including user management) and manager (works with resources and
    initiatives). Renamed from the earlier admin/member pair: 'member'
    served no purpose once the conceptual split was clarified — regular
    employees live as Resources and don't log in at all."""

    email: EmailStr
    password_hash: str
    role: Literal["admin", "manager"] = "manager"
    resource_id: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
        indexes = [IndexModel("email", unique=True)]
