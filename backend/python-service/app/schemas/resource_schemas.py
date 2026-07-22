from pydantic import BaseModel


class ResourceCreate(BaseModel):
    name: str
    rate: float


class ResourceUpdate(BaseModel):
    name: str | None = None
    rate: float | None = None
