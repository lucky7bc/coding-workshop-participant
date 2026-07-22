from pydantic import BaseModel


class DeliverableCreate(BaseModel):
    name: str


class DeliverableUpdate(BaseModel):
    name: str | None = None
    completed: bool | None = None
