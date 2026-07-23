from datetime import datetime, timezone
from typing import Literal

from beanie import Document
from pydantic import Field
from pymongo import IndexModel


# MilestoneStatus is a type alias for the possible statuses of a milestone.
MilestoneStatus = Literal["pending", "in_progress", "complete", "missed"]

# Milestone model representing a milestone entity in the database.
class Milestone(Document):

    initiative_id: int
    name: str
    target_week: int
    status: MilestoneStatus = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "milestones"
        indexes = [IndexModel("initiative_id")]
