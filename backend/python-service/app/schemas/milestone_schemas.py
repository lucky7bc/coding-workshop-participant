from typing import Literal

from pydantic import BaseModel

MilestoneStatus = Literal["pending", "in_progress", "complete", "missed"]


class MilestoneCreate(BaseModel):
    name: str
    target_week: int


class MilestoneUpdate(BaseModel):
    name: str | None = None
    target_week: int | None = None
    status: MilestoneStatus | None = None
