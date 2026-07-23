from app.core.annotations import PostMapping, RestController
from app.core.dependencies import require_role
from app.schemas.auth_schemas import LoginRequest, LogoutRequest, RefreshRequest, RegisterRequest
from app.services.auth_service import AuthService
from fastapi import Depends

# Auth Controller, which handles authentication-related endpoints 
# such as login, logout, token refresh, and user registration. 
# The controller uses the AuthService to perform the necessary operations 
# for each endpoint.
@RestController(prefix="/auth", tags=["Auth"])
class AuthController:
    # Login endpoint for user authentication. 
    # It accepts a LoginRequest body containing the user's email and 
    #password, and returns an authentication token upon successful login.
    @PostMapping("/login")
    async def login(self, body: LoginRequest):
        return await AuthService.login(body.email, body.password)

    # Refresh endpoint for refreshing authentication tokens.
    @PostMapping("/refresh")
    async def refresh(self, body: RefreshRequest):
        return await AuthService.refresh(body.refresh_token)

    # Logout endpoint for user logout. It accepts a LogoutRequest body containing the 
    # user's refresh token and invalidates it, effectively logging the user out.
    @PostMapping("/logout", status_code=204)
    async def logout(self, body: LogoutRequest):
        await AuthService.logout(body.refresh_token)

    # Register endpoint for user registration.
    @PostMapping("/register", status_code=201)
    async def register(self, body: RegisterRequest, user: dict = Depends(require_role("admin"))):
        return await AuthService.register(body.email, body.password, body.role, body.resource_id)
