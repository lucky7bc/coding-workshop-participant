from typing import Literal

from pydantic import BaseModel

InitiativeStatus = Literal["not_started", "in_progress", "at_risk", "delayed", "completed"]


class InitiativeCreate(BaseModel):
    name: str
    budget: float
    time_allocated: int


class InitiativeUpdate(BaseModel):
    name: str | None = None
    budget: float | None = None
    status: InitiativeStatus | None = None
    current_week: int | None = None


class AllocationAdd(BaseModel):
    resource_id: int
    allocated_hours: float


class AllocationUpdate(BaseModel):
    allocated_hours: float
