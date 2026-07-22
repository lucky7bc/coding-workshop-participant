from datetime import datetime, timezone
from typing import Literal

from beanie import Document
from pydantic import Field
from pymongo import IndexModel

MilestoneStatus = Literal["pending", "in_progress", "complete", "missed"]


class Milestone(Document):
    """Own collection, not embedded on Initiative — no field for it existed
    in the original sample doc, it has its own CRUD lifecycle independent
    of the initiative's, and unbounded embedded arrays with independent
    write patterns are the standard Mongo anti-pattern to avoid. Uses
    Beanie's own id (Mongo _id) for :mId — unlike resources/initiatives,
    nothing else cross-references a milestone."""

    initiative_id: int
    name: str
    target_week: int
    status: MilestoneStatus = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "milestones"
        indexes = [IndexModel("initiative_id")]
