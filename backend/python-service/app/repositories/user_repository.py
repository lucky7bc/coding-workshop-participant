from typing import Optional

from beanie import PydanticObjectId

from app.models.user import User


class UserRepository:
    @staticmethod
    async def find_by_email(email: str) -> Optional[User]:
        return await User.find_one(User.email == email.lower())

    @staticmethod
    async def find_by_id(user_id: str) -> Optional[User]:
        return await User.get(PydanticObjectId(user_id))

    @staticmethod
    async def find_all() -> list:
        return await User.find_all().sort("+email").to_list()

    @staticmethod
    async def create(**data) -> User:
        user = User(**data)
        await user.insert()
        return user

    @staticmethod
    async def update_role(user_id: str, role: str) -> Optional[User]:
        user = await UserRepository.find_by_id(user_id)
        if not user:
            return None
        await user.set({"role": role})
        return user

    @staticmethod
    async def delete(user_id: str) -> bool:
        user = await UserRepository.find_by_id(user_id)
        if not user:
            return False
        await user.delete()
        return True
