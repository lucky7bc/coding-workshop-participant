from app.core.errors import AppError
from app.models.counter import next_sequence
from app.repositories.resource_repository import ResourceRepository

# Service layer for resource-related operations
class ResourceService:
    # Lists all resources in the system.
    @staticmethod
    async def list_all():
        return await ResourceRepository.find_all()

    # Retrieves a specific resource by its numeric ID. Raises an 
    # error if not found.
    @staticmethod
    async def get(numeric_id: int):
        resource = await ResourceRepository.find_by_id(numeric_id)
        if not resource:
            raise AppError(404, "Resource not found")
        return resource

    # Creates a new resource with the given name and rate.
    @staticmethod
    async def create(name: str, rate: float):
        numeric_id = await next_sequence("resourceId")
        return await ResourceRepository.create(numeric_id=numeric_id, name=name, rate=rate, initiatives=[])

    # Updates an existing resource with the provided data. 
    #Raises an error if the resource does not exist.
    @staticmethod
    async def update(numeric_id: int, **data):
        updated = await ResourceRepository.update(numeric_id, **data)
        if not updated:
            raise AppError(404, "Resource not found")
        return updated

    # Deletes a resource by its numeric ID. Also removes 
    #any links to initiatives. Raises an error if the resource does not exist.
    @staticmethod
    async def remove(numeric_id: int):
        resource = await ResourceRepository.find_by_id(numeric_id)
        if not resource:
            raise AppError(404, "Resource not found")
        from app.repositories.initiative_repository import InitiativeRepository
        for link in resource.initiatives:
            await InitiativeRepository.remove_resource_link(link.initiative_id, numeric_id, session=None)
        deleted = await ResourceRepository.delete(numeric_id)
        if not deleted:
            raise AppError(404, "Resource not found")
