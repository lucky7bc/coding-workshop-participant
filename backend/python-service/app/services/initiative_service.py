from app.core.errors import AppError
from app.models.counter import next_sequence
from app.repositories.initiative_repository import InitiativeRepository


class InitiativeService:
    @staticmethod
    async def list_all():
        return await InitiativeRepository.find_all()

    @staticmethod
    async def get(numeric_id: int):
        initiative = await InitiativeRepository.find_by_id(numeric_id)
        if not initiative:
            raise AppError(404, "Initiative not found")
        return initiative

    @staticmethod
    async def create(name: str, budget: float, time_allocated: int):
        numeric_id = await next_sequence("initiativeId")
        return await InitiativeRepository.create(
            numeric_id=numeric_id,
            name=name,
            budget=budget,
            time_allocated=time_allocated,
            current_week=0,
            status="not_started",
            resources=[],
        )

    @staticmethod
    async def update(numeric_id: int, **data):
        updated = await InitiativeRepository.update(numeric_id, **data)
        if not updated:
            raise AppError(404, "Initiative not found")
        return updated

    @staticmethod
    async def remove(numeric_id: int):
        deleted = await InitiativeRepository.delete(numeric_id)
        if not deleted:
            raise AppError(404, "Initiative not found")
