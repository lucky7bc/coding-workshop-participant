from pymongo.asynchronous.client_session import AsyncClientSession

from app.models.initiative import Initiative


class InitiativeRepository:
    @staticmethod
    async def find_all() -> list[Initiative]:
        return await Initiative.find_all().sort("+id").to_list()

    @staticmethod
    async def find_by_id(numeric_id: int) -> Initiative | None:
        return await Initiative.find_one(Initiative.numeric_id == numeric_id)

    @staticmethod
    async def create(**data) -> Initiative:
        initiative = Initiative(**data)
        await initiative.insert()
        return initiative

    @staticmethod
    async def update(numeric_id: int, **data) -> Initiative | None:
        initiative = await InitiativeRepository.find_by_id(numeric_id)
        if not initiative:
            return None
        await initiative.set({k: v for k, v in data.items() if v is not None})
        return initiative

    @staticmethod
    async def delete(numeric_id: int) -> bool:
        initiative = await InitiativeRepository.find_by_id(numeric_id)
        if not initiative:
            return False
        await initiative.delete()
        return True

    @staticmethod
    async def add_resource_link(
        initiative_id: int, resource_id: int, allocated_hours: float, session: AsyncClientSession | None = None
    ) -> None:
        await Initiative.find_one(Initiative.numeric_id == initiative_id, session=session).update(
            {"$push": {"resources": {"resource_id": resource_id, "allocated_hours": allocated_hours}}},
            session=session,
        )

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

    @staticmethod
    async def remove_resource_link(
        initiative_id: int, resource_id: int, session: AsyncClientSession | None = None
    ) -> None:
        await Initiative.find_one(Initiative.numeric_id == initiative_id, session=session).update(
            {"$pull": {"resources": {"resource_id": resource_id}}},
            session=session,
        )
