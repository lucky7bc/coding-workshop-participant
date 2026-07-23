from pymongo import AsyncMongoClient

from app.core.errors import AppError
from app.repositories.initiative_repository import InitiativeRepository
from app.repositories.resource_repository import ResourceRepository


# Service layer for allocation-related operations
class AllocationService:
    """The API commits to bidirectional embedding (an id array on
    each side), every allocation change is inherently a two-document write.
    Without a transaction, a crash between the two writes leaves the
    documents disagreeing about who's allocated to what. Same reasoning and
    same DEPLOYMENT REQUIREMENT as the Node backend: PyMongo async
    transactions require a replica set (a single-node one is enough) — this
    will throw at runtime against a standalone mongod."""

    # Retrieves a budget breakdown for a specific initiative,
    # including total spend, remaining budget, weekly burn rate,
    # projected spend at completion, and a detailed breakdown of
    # resource allocations and costs.
    @staticmethod
    async def add_resource_to_initiative(client: AsyncMongoClient, initiative_id: int, resource_id: int, allocated_hours: float):
        async with client.start_session() as session:
            async with await session.start_transaction():
                initiative = await InitiativeRepository.find_by_id(initiative_id)
                resource = await ResourceRepository.find_by_id(resource_id)
                if not initiative:
                    raise AppError(404, "Initiative not found")
                if not resource:
                    raise AppError(404, "Resource not found")

                already_linked = any(r.resource_id == resource_id for r in initiative.resources)
                if already_linked:
                    raise AppError(409, "Resource already allocated to this initiative — use PATCH to update hours")

                await InitiativeRepository.add_resource_link(initiative_id, resource_id, allocated_hours, session)
                await ResourceRepository.add_initiative_link(resource_id, initiative_id, allocated_hours, session)

        return await InitiativeRepository.find_by_id(initiative_id)

    # Updates the allocated hours for a specific resource on a 
    # specific initiative.
    @staticmethod
    async def update_allocated_hours(client: AsyncMongoClient, initiative_id: int, resource_id: int, allocated_hours: float):
        async with client.start_session() as session:
            async with await session.start_transaction():
                await InitiativeRepository.update_resource_hours(initiative_id, resource_id, allocated_hours, session)
                await ResourceRepository.update_initiative_hours(resource_id, initiative_id, allocated_hours, session)

        updated = await InitiativeRepository.find_by_id(initiative_id)
        if not updated or not any(r.resource_id == resource_id for r in updated.resources):
            raise AppError(404, "Allocation link not found — resource is not currently on this initiative")
        return updated

    # Removes a resource from an initiative, ensuring that both 
    # the initiative and resource documents are updated to reflect 
    # the removal of the allocation link.
    @staticmethod
    async def remove_resource_from_initiative(client: AsyncMongoClient, initiative_id: int, resource_id: int):
        async with client.start_session() as session:
            async with await session.start_transaction():
                await InitiativeRepository.remove_resource_link(initiative_id, resource_id, session)
                await ResourceRepository.remove_initiative_link(resource_id, initiative_id, session)
