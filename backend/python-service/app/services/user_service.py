from app.core.errors import AppError
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository


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


class UserService:
    @staticmethod
    async def list_all() -> list:
        users = await UserRepository.find_all()
        return [_public(u) for u in users]

    @staticmethod
    async def update_role(user_id: str, role: str, acting_user_id: str) -> dict:
        # Self-demotion guard: the last admin demoting themselves would
        # lock everyone out of user management permanently (register and
        # all /users routes are admin-gated). Cheap to prevent here.
        if user_id == acting_user_id and role != "admin":
            raise AppError(400, "You can't change your own admin role")
        updated = await UserRepository.update_role(user_id, role)
        if not updated:
            raise AppError(404, "User not found")
        return _public(updated)

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
