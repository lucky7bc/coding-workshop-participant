from pymongo.asynchronous.client_session import AsyncClientSession

from app.models.resource import Resource


class ResourceRepository:
    @staticmethod
    async def find_all() -> list[Resource]:
        return await Resource.find_all().sort("+id").to_list()

    @staticmethod
    async def find_by_id(numeric_id: int) -> Resource | None:
        return await Resource.find_one(Resource.numeric_id == numeric_id)

    @staticmethod
    async def create(**data) -> Resource:
        resource = Resource(**data)
        await resource.insert()
        return resource

    @staticmethod
    async def update(numeric_id: int, **data) -> Resource | None:
        resource = await ResourceRepository.find_by_id(numeric_id)
        if not resource:
            return None
        await resource.set({k: v for k, v in data.items() if v is not None})
        return resource

    @staticmethod
    async def delete(numeric_id: int) -> bool:
        resource = await ResourceRepository.find_by_id(numeric_id)
        if not resource:
            return False
        await resource.delete()
        return True

    # The three methods below exist because allocation is a two-document
    # write (see initiative_repository.py's mirrored methods +
    # allocation_service.py for the transaction that keeps them in sync).
    @staticmethod
    async def add_initiative_link(
        resource_id: int, initiative_id: int, allocated_hours: float, session: AsyncClientSession | None = None
    ) -> None:
        await Resource.find_one(Resource.numeric_id == resource_id, session=session).update(
            {"$push": {"initiatives": {"initiative_id": initiative_id, "allocated_hours": allocated_hours}}},
            session=session,
        )

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

    @staticmethod
    async def remove_initiative_link(
        resource_id: int, initiative_id: int, session: AsyncClientSession | None = None
    ) -> None:
        await Resource.find_one(Resource.numeric_id == resource_id, session=session).update(
            {"$pull": {"initiatives": {"initiative_id": initiative_id}}},
            session=session,
        )
