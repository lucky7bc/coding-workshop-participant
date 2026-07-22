from app.core.errors import AppError
from app.models.counter import next_sequence
from app.repositories.resource_repository import ResourceRepository


class ResourceService:
    @staticmethod
    async def list_all():
        return await ResourceRepository.find_all()

    @staticmethod
    async def get(numeric_id: int):
        resource = await ResourceRepository.find_by_id(numeric_id)
        if not resource:
            raise AppError(404, "Resource not found")
        return resource

    @staticmethod
    async def create(name: str, rate: float):
        numeric_id = await next_sequence("resourceId")
        return await ResourceRepository.create(numeric_id=numeric_id, name=name, rate=rate, initiatives=[])

    @staticmethod
    async def update(numeric_id: int, **data):
        updated = await ResourceRepository.update(numeric_id, **data)
        if not updated:
            raise AppError(404, "Resource not found")
        return updated

    @staticmethod
    async def remove(numeric_id: int):
        deleted = await ResourceRepository.delete(numeric_id)
        if not deleted:
            raise AppError(404, "Resource not found")
