from datetime import datetime, timezone

from beanie import Document
from pydantic import BaseModel, Field
from pymongo import IndexModel


class ResourceInitiativeLink(BaseModel):
    """CORRECTED from the original sample document, which had a single flat
    allocated_hours field on the resource itself — that shape can only hold
    one value total, but the UI spec requires per-person, per-initiative
    hours. Now an embedded list of (initiative_id, allocated_hours) pairs.
    Same fix as the Node backend's resource.model.ts."""

    initiative_id: int
    allocated_hours: float  # confirmed: hours/week, recurring — see budget_service.py


class Resource(Document):
    # NOTE: originally aliased to "id" to match the Node backend's field
    # naming for cross-backend compatibility. That doesn't work — Beanie's
    # own Document base class already owns a real field literally named
    # `id` (mapped to Mongo's _id, typed PydanticObjectId), so aliasing a
    # second field to that same name is a structural collision, not a
    # call-site issue: Pydantic resolves it in favor of the literal field
    # every time, silently routing values meant for this field into
    # Beanie's ObjectId field instead. Since Python is now the only
    # backend, there's no need to force this field to look like "id" in
    # storage — it's just honestly named `numeric_id` here and in Mongo.
    numeric_id: int
    name: str
    rate: float  # hourly rate — confirmed flat per-resource, not per-initiative
    initiatives: list[ResourceInitiativeLink] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "resources"
        indexes = [IndexModel("numeric_id", unique=True)]
