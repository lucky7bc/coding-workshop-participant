from app.core.annotations import PostMapping, RestController
from app.core.dependencies import require_role
from app.schemas.auth_schemas import LoginRequest, LogoutRequest, RefreshRequest, RegisterRequest
from app.services.auth_service import AuthService
from fastapi import Depends


@RestController(prefix="/auth", tags=["Auth"])
class AuthController:
    @PostMapping("/login")
    async def login(self, body: LoginRequest):
        return await AuthService.login(body.email, body.password)

    @PostMapping("/refresh")
    async def refresh(self, body: RefreshRequest):
        return await AuthService.refresh(body.refresh_token)

    @PostMapping("/logout", status_code=204)
    async def logout(self, body: LogoutRequest):
        await AuthService.logout(body.refresh_token)

    # Not in the original endpoint map — see auth_service.py for why this
    # exists. Admin-gated; first admin is bootstrapped via
    # scripts/seed_admin.py.
    @PostMapping("/register", status_code=201)
    async def register(self, body: RegisterRequest, user: dict = Depends(require_role("admin"))):
        return await AuthService.register(body.email, body.password, body.role, body.resource_id)
