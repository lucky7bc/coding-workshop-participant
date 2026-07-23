from datetime import datetime, timezone

from beanie import Document
from pydantic import Field
from pymongo import IndexModel


# Deliverable model representing a deliverable entity in the database.
class Deliverable(Document):

    initiative_id: int
    name: str
    completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "deliverables"
        indexes = [IndexModel("initiative_id")]
