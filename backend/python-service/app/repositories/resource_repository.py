from pymongo.asynchronous.client_session import AsyncClientSession

from app.models.resource import Resource

# Repository layer for resource-related database operations
class ResourceRepository:
    # Retrieves all resources, sorted by ID.
    @staticmethod
    async def find_all() -> list[Resource]:
        return await Resource.find_all().sort("+id").to_list()

    # Retrieves a resource by its unique numeric ID, returning None if not found.
    @staticmethod
    async def find_by_id(numeric_id: int) -> Resource | None:
        return await Resource.find_one(Resource.numeric_id == numeric_id)

    # Creates a new resource with the provided data and inserts it into the database.
    @staticmethod
    async def create(**data) -> Resource:
        resource = Resource(**data)
        await resource.insert()
        return resource

    # Updates an existing resource by its unique numeric ID with the provided data
    @staticmethod
    async def update(numeric_id: int, **data) -> Resource | None:
        resource = await ResourceRepository.find_by_id(numeric_id)
        if not resource:
            return None
        await resource.set({k: v for k, v in data.items() if v is not None})
        return resource

    # Deletes a resource by its unique numeric ID, returning True if 
    # successful, False if not found.
    @staticmethod
    async def delete(numeric_id: int) -> bool:
        resource = await ResourceRepository.find_by_id(numeric_id)
        if not resource:
            return False
        await resource.delete()
        return True

    # The three methods below exist because allocation is a two-document
    # write. This keeps them in sync. If we don't do this, we can end up 
    # with a resource that thinks it's allocated to an initiative, 
    #but the initiative doesn't think it's allocated to the resource.
    @staticmethod
    async def add_initiative_link(
        resource_id: int, initiative_id: int, allocated_hours: float, session: AsyncClientSession | None = None
    ) -> None:
        await Resource.find_one(Resource.numeric_id == resource_id, session=session).update(
            {"$push": {"initiatives": {"initiative_id": initiative_id, "allocated_hours": allocated_hours}}},
            session=session,
        )

    # Updates the allocated hours for a specific initiative linked to a resource.
    @staticmethod
    async def update_initiative_hours(
        resource_id: int, initiative_id: int, allocated_hours: float, session: AsyncClientSession | None = None
    ) -> None:
        await Resource.find_one(
            Resource.numeric_id == resource_id,
            {"initiatives.initiative_id": initiative_id},
            session=session,
        ).update(
            {"$set": {"initiatives.$.allocated_hours": allocated_hours}},
            session=session,
        )

    # Removes the link between a resource and a specific initiative.
    @staticmethod
    async def remove_initiative_link(
        resource_id: int, initiative_id: int, session: AsyncClientSession | None = None
    ) -> None:
        await Resource.find_one(Resource.numeric_id == resource_id, session=session).update(
            {"$pull": {"initiatives": {"initiative_id": initiative_id}}},
            session=session,
        )
