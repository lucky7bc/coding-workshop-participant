from beanie import PydanticObjectId

from app.models.deliverable import Deliverable

# Repository layer for deliverable-related database operations
class DeliverableRepository:
    @staticmethod
    async def find_by_initiative(initiative_id: int) -> list[Deliverable]:
        return await Deliverable.find(Deliverable.initiative_id == initiative_id).sort("+created_at").to_list()

    # Retrieves a deliverable by its unique ID, returning None if not found.
    @staticmethod
    async def find_by_id(deliverable_id: str) -> Deliverable | None:
        return await Deliverable.get(PydanticObjectId(deliverable_id))

    # Deletes a deliverable by its unique ID, returning True 
    # if successful, False if not found.
    @staticmethod
    async def create(**data) -> Deliverable:
        deliverable = Deliverable(**data)
        await deliverable.insert()
        return deliverable

    # Updates an existing deliverable by its unique ID with the provided data.
    @staticmethod
    async def update(deliverable_id: str, **data) -> Deliverable | None:
        deliverable = await DeliverableRepository.find_by_id(deliverable_id)
        if not deliverable:
            return None
        await deliverable.set({k: v for k, v in data.items() if v is not None})
        return deliverable

    # Deletes a deliverable by its unique ID, returning True if successful, 
    #False if not found.
    @staticmethod
    async def delete(deliverable_id: str) -> bool:
        deliverable = await DeliverableRepository.find_by_id(deliverable_id)
        if not deliverable:
            return False
        await deliverable.delete()
        return True
