from datetime import datetime, timezone
from typing import Literal

from beanie import Document
from pydantic import BaseModel, Field
from pymongo import IndexModel

InitiativeStatus = Literal["not_started", "in_progress", "at_risk", "delayed", "completed"]


class InitiativeResourceLink(BaseModel):
    """Mirror of ResourceInitiativeLink. The API's own language ("push IDs
    to both arrays", "clean both arrays") commits to bidirectional
    embedding rather than a normalized join collection, so this shape is
    preserved from the original design, not replaced."""

    resource_id: int
    allocated_hours: float


class Initiative(Document):
    # See resource.py for why this is a plain `numeric_id` field, not
    # aliased to "id" — Beanie's own Document.id already owns that name.
    numeric_id: int
    name: str
    budget: float
    status: InitiativeStatus = "not_started"
    time_allocated: int  # total weeks planned
    current_week: int = 0  # manually advanced via PUT — not date-derived
    resources: list[InitiativeResourceLink] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "initiatives"
        indexes = [IndexModel("numeric_id", unique=True)]
