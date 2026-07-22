from beanie import Document
from pymongo import ReturnDocument


class Counter(Document):
    """Mongo has no native auto-increment. Both sample documents from the
    original project cross-reference each other via a numeric `id` field
    (never Mongo's own _id), so that id has to be assigned deterministically
    — same reasoning as the Node backend's counter.model.ts. Uses the
    sequence name directly as _id (Beanie allows overriding the id type)."""

    id: str  # sequence name (e.g. "resourceId", "initiativeId") acts as _id
    seq: int = 0

    class Settings:
        name = "counters"


async def next_sequence(name: str) -> int:
    collection = Counter.get_pymongo_collection()
    doc = await collection.find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return doc["seq"]
