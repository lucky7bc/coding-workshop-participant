from fastapi import Depends

from app.core.annotations import DeleteMapping, GetMapping, PatchMapping, RestController
from app.core.dependencies import require_role
from app.schemas.user_schemas import UserRoleUpdate
from app.services.user_service import UserService


@RestController(prefix="/users", tags=["Users"])
class UserController:
    """All admin-gated: user management is the one capability that
    separates admin from manager."""

    @GetMapping("")
    async def list_users(self, user: dict = Depends(require_role("admin"))):
        return await UserService.list_all()

    @PatchMapping("/{user_id}")
    async def update_role(self, user_id: str, body: UserRoleUpdate, user: dict = Depends(require_role("admin"))):
        return await UserService.update_role(user_id, body.role, acting_user_id=user["id"])

    @DeleteMapping("/{user_id}", status_code=204)
    async def delete_user(self, user_id: str, user: dict = Depends(require_role("admin"))):
        await UserService.remove(user_id, acting_user_id=user["id"])
