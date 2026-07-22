from beanie import PydanticObjectId

from app.models.milestone import Milestone


class MilestoneRepository:
    @staticmethod
    async def find_by_initiative(initiative_id: int) -> list[Milestone]:
        return await Milestone.find(Milestone.initiative_id == initiative_id).sort("+target_week").to_list()

    @staticmethod
    async def find_by_id(milestone_id: str) -> Milestone | None:
        return await Milestone.get(PydanticObjectId(milestone_id))

    @staticmethod
    async def create(**data) -> Milestone:
        milestone = Milestone(**data)
        await milestone.insert()
        return milestone

    @staticmethod
    async def update(milestone_id: str, **data) -> Milestone | None:
        milestone = await MilestoneRepository.find_by_id(milestone_id)
        if not milestone:
            return None
        await milestone.set({k: v for k, v in data.items() if v is not None})
        return milestone

    @staticmethod
    async def delete(milestone_id: str) -> bool:
        milestone = await MilestoneRepository.find_by_id(milestone_id)
        if not milestone:
            return False
        await milestone.delete()
        return True
