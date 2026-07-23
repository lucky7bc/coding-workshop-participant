from app.core.errors import AppError
from app.repositories.deliverable_repository import DeliverableRepository

# Service layer for deliverable-related operations
class DeliverableService:
    # Lists all deliverables associated with a specific initiative.
    # runs with the initiative_id to fetch deliverables linked to that initiative.
    @staticmethod
    async def list_all(initiative_id: int):
        return await DeliverableRepository.find_by_initiative(initiative_id)

    # Retrieves a specific deliverable by its ID. Raises an error if not found.
    @staticmethod
    async def add(initiative_id: int, name: str):
        return await DeliverableRepository.create(initiative_id=initiative_id, name=name, completed=False)

    # Retrieves a specific deliverable by its ID. Raises an error if not found.
    @staticmethod
    async def update(deliverable_id: str, **data):
        updated = await DeliverableRepository.update(deliverable_id, **data)
        if not updated:
            raise AppError(404, "Deliverable not found")
        return updated

    # Deletes a deliverable by its ID. Raises an error if not found.
    @staticmethod
    async def remove(deliverable_id: str):
        deleted = await DeliverableRepository.delete(deliverable_id)
        if not deleted:
            raise AppError(404, "Deliverable not found")
