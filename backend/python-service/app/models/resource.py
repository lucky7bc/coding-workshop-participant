from datetime import datetime, timezone

from beanie import Document
from pydantic import BaseModel, Field
from pymongo import IndexModel

# Resource model and its associated link model for initiatives.
class ResourceInitiativeLink(BaseModel):
    # Mirror of InitiativeResourceLink. The API's own language ("push IDs
    # to both arrays", "clean both arrays") commits to bidirectional
    # embedding rather than a normalized join collection, so this shape is
    # preserved from the original design, not replaced.
    initiative_id: int
    allocated_hours: float  # confirmed: hours/week, recurring — see budget_service.py


# Resource model representing a resource entity in the database.
class Resource(Document):
    numeric_id: int
    name: str
    rate: float  # hourly rate — confirmed flat per-resource, not per-initiative
    initiatives: list[ResourceInitiativeLink] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "resources"
        indexes = [IndexModel("numeric_id", unique=True)]
