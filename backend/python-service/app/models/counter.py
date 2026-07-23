from beanie import Document
from pymongo import ReturnDocument


# Counter model for managing auto-incrementing sequences in MongoDB.
class Counter(Document):
    id: str  # sequence name (e.g. "resourceId", "initiativeId") acts as _id
    seq: int = 0

    class Settings:
        name = "counters"


# Function to get the next sequence number for a given sequence name.
async def next_sequence(name: str) -> int:
    collection = Counter.get_pymongo_collection()
    doc = await collection.find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return doc["seq"]
