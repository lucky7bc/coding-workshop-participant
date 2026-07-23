from pymongo.asynchronous.client_session import AsyncClientSession

from app.models.initiative import Initiative

# Repository layer for initiative-related database operations
class InitiativeRepository:
    # Retrieves all initiatives, sorted by ID.
    @staticmethod
    async def find_all() -> list[Initiative]:
        return await Initiative.find_all().sort("+id").to_list()

    # Retrieves an initiative by its unique numeric ID, returning None if not found.
    @staticmethod
    async def find_by_id(numeric_id: int) -> Initiative | None:
        return await Initiative.find_one(Initiative.numeric_id == numeric_id)

    # Creates a new initiative with the provided data and inserts 
    # it into the database.
    @staticmethod
    async def create(**data) -> Initiative:
        initiative = Initiative(**data)
        await initiative.insert()
        return initiative

    # Updates an existing initiative by its unique numeric ID with 
    # the provided data.
    @staticmethod
    async def update(numeric_id: int, **data) -> Initiative | None:
        initiative = await InitiativeRepository.find_by_id(numeric_id)
        if not initiative:
            return None
        await initiative.set({k: v for k, v in data.items() if v is not None})
        return initiative

    # Deletes an initiative by its unique numeric ID, returning True if
    @staticmethod
    async def delete(numeric_id: int) -> bool:
        initiative = await InitiativeRepository.find_by_id(numeric_id)
        if not initiative:
            return False
        await initiative.delete()
        return True

    # The three methods below exist because allocation is a two-document
    # write. This keeps them in sync. If we don't do this, we can end up with an 
    # initiative that thinks it's allocated to a resource, but the resource 
    # doesn't think it's allocated to the initiative.
    # Adds a link between an initiative and a resource, 
    # specifying the allocated hours.
    @staticmethod
    async def add_resource_link(
        initiative_id: int, resource_id: int, allocated_hours: float, session: AsyncClientSession | None = None
    ) -> None:
        await Initiative.find_one(Initiative.numeric_id == initiative_id, session=session).update(
            {"$push": {"resources": {"resource_id": resource_id, "allocated_hours": allocated_hours}}},
            session=session,
        )

    # Updates the allocated hours for a specific resource linked 
    # to an initiative.
    @staticmethod
    async def update_resource_hours(
        initiative_id: int, resource_id: int, allocated_hours: float, session: AsyncClientSession | None = None
    ) -> None:
        await Initiative.find_one(
            Initiative.numeric_id == initiative_id,
            {"resources.resource_id": resource_id},
            session=session,
        ).update(
            {"$set": {"resources.$.allocated_hours": allocated_hours}},
            session=session,
        )

    # Removes the link between an initiative and a resource,
    @staticmethod
    async def remove_resource_link(
        initiative_id: int, resource_id: int, session: AsyncClientSession | None = None
    ) -> None:
        await Initiative.find_one(Initiative.numeric_id == initiative_id, session=session).update(
            {"$pull": {"resources": {"resource_id": resource_id}}},
            session=session,
        )
