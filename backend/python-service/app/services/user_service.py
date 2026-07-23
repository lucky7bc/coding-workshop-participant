from app.core.errors import AppError
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository

# Helper function to create a public user representation
def _public(user) -> dict:
    """Never expose password_hash — this is the only shape user records
    leave the service in."""
    return {
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
        "resource_id": user.resource_id,
        "created_at": user.created_at,
    }

# UserService handles user management operations such as listing users, 
#updating roles, and removing users.
class UserService:
    # List all users in the system, returning a list of public user representations
    @staticmethod
    async def list_all() -> list:
        users = await UserRepository.find_all()
        return [_public(u) for u in users]

    # Update the role of a user, ensuring that users cannot demote themselves 
    # from admin
    @staticmethod
    async def update_role(user_id: str, role: str, acting_user_id: str) -> dict:
        # Self-demotion guard: the last admin demoting themselves would
        # lock everyone out of user management permanently
            raise AppError(400, "You can't change your own admin role")
        updated = await UserRepository.update_role(user_id, role)
        if not updated:
            raise AppError(404, "User not found")
        return _public(updated)

    # Remove a user from the system, ensuring that users cannot 
    # delete their own account
    @staticmethod
    async def remove(user_id: str, acting_user_id: str) -> None:
        if user_id == acting_user_id:
            raise AppError(400, "You can't delete your own account")
        deleted = await UserRepository.delete(user_id)
        if not deleted:
            raise AppError(404, "User not found")
        # Revoke the deleted user's refresh tokens so their sessions
        # actually end rather than surviving until token expiry.
        from beanie import PydanticObjectId

        await RefreshTokenRepository.revoke_all_for_user(PydanticObjectId(user_id))
