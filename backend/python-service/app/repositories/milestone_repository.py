from beanie import PydanticObjectId

from app.models.milestone import Milestone

# Repository layer for milestone-related database operations
class MilestoneRepository:
    # Retrieves all milestones associated with a specific 
    # initiative, sorted by target week.
    @staticmethod
    async def find_by_initiative(initiative_id: int) -> list[Milestone]:
        return await Milestone.find(Milestone.initiative_id == initiative_id).sort("+target_week").to_list()

    # Retrieves a milestone by its unique ID, returning None if not found.
    @staticmethod
    async def find_by_id(milestone_id: str) -> Milestone | None:
        return await Milestone.get(PydanticObjectId(milestone_id))

    # Creates a new milestone with the provided data and inserts 
    # it into the database.
    @staticmethod
    async def create(**data) -> Milestone:
        milestone = Milestone(**data)
        await milestone.insert()
        return milestone

    # Updates an existing milestone by its unique ID with the provided data.
    @staticmethod
    async def update(milestone_id: str, **data) -> Milestone | None:
        milestone = await MilestoneRepository.find_by_id(milestone_id)
        if not milestone:
            return None
        await milestone.set({k: v for k, v in data.items() if v is not None})
        return milestone

    # Deletes a milestone by its unique ID, returning True if 
    # successful, False if not found.
    @staticmethod
    async def delete(milestone_id: str) -> bool:
        milestone = await MilestoneRepository.find_by_id(milestone_id)
        if not milestone:
            return False
        await milestone.delete()
        return True
