from datetime import datetime, timezone
from typing import Literal

from beanie import Document
from pydantic import BaseModel, Field
from pymongo import IndexModel

# The InitiativeStatus type is a Literal type that defines the possible 
# statuses for an initiative. It can be one of the following strings: 
# "not_started", "in_progress", "at_risk", "delayed", or "completed". 
# This allows for type checking and validation of the status field in the 
# Initiative model.
InitiativeStatus = Literal["not_started", "in_progress", "at_risk", "delayed", "completed"]

# The InitiativeResourceLink model represents a link between an 
# initiative and a resource.
class InitiativeResourceLink(BaseModel):

    resource_id: int
    allocated_hours: float


# The Initiative model represents an initiative entity in the database.
class Initiative(Document):

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
