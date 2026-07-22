from app.core.errors import AppError
from app.repositories.initiative_repository import InitiativeRepository
from app.repositories.milestone_repository import MilestoneRepository


class TimelineService:
    @staticmethod
    async def get_timeline(initiative_id: int) -> dict:
        initiative = await InitiativeRepository.find_by_id(initiative_id)
        if not initiative:
            raise AppError(404, "Initiative not found")

        milestones = await MilestoneRepository.find_by_initiative(initiative_id)

        # progress_pct is derived (current_week / time_allocated), not
        # stored — avoids a second source of truth that could drift from
        # current_week. Same as the Node backend.
        progress_pct = (
            min(100, round((initiative.current_week / initiative.time_allocated) * 100))
            if initiative.time_allocated > 0
            else 0
        )

        return {
            "initiative_id": initiative_id,
            "progress_pct": progress_pct,
            "current_week": initiative.current_week,
            "time_allocated": initiative.time_allocated,
            "status": initiative.status,
            "milestones": milestones,
        }

    @staticmethod
    async def add_milestone(initiative_id: int, name: str, target_week: int):
        return await MilestoneRepository.create(
            initiative_id=initiative_id, name=name, target_week=target_week, status="pending"
        )

    @staticmethod
    async def update_milestone(milestone_id: str, **data):
        updated = await MilestoneRepository.update(milestone_id, **data)
        if not updated:
            raise AppError(404, "Milestone not found")
        return updated

    @staticmethod
    async def remove_milestone(milestone_id: str):
        deleted = await MilestoneRepository.delete(milestone_id)
        if not deleted:
            raise AppError(404, "Milestone not found")
