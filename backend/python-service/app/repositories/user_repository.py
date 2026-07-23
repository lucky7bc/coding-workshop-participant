from typing import Optional

from beanie import PydanticObjectId

from app.models.user import User

# Repository for handling user-related database operations
class UserRepository:
    # Retrieves a user by their email address, returning None if not found.
    @staticmethod
    async def find_by_email(email: str) -> Optional[User]:
        return await User.find_one(User.email == email.lower())

    # Retrieves a user by their unique ID, returning None if not found.
    @staticmethod
    async def find_by_id(user_id: str) -> Optional[User]:
        return await User.get(PydanticObjectId(user_id))

    # Retrieves all users, sorted by email.
    @staticmethod
    async def find_all() -> list:
        return await User.find_all().sort("+email").to_list()

    # Creates a new user with the provided data and inserts it into the database.
    @staticmethod
    async def create(**data) -> User:
        user = User(**data)
        await user.insert()
        return user

    # Updates the role of a user by their unique ID.
    @staticmethod
    async def update_role(user_id: str, role: str) -> Optional[User]:
        user = await UserRepository.find_by_id(user_id)
        if not user:
            return None
        await user.set({"role": role})
        return user

    # Deletes a user by their unique ID, returning True if successful, 
    # False if not found.
    @staticmethod
    async def delete(user_id: str) -> bool:
        user = await UserRepository.find_by_id(user_id)
        if not user:
            return False
        await user.delete()
        return True
