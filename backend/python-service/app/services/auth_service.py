from app.core.errors import AppError
from app.core.security import (
    hash_password,
    hash_token,
    sign_access_token,
    sign_refresh_token,
    verify_password,
    decode_refresh_token,
)
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository


# Service layer for authentication-related operations
class AuthService:
    # Authenticates a user with the provided email and password.
    # Returns access and refresh tokens upon successful authentication.
    @staticmethod
    async def login(email: str, password: str) -> dict:
        user = await UserRepository.find_by_email(email)
        if not user:
            raise AppError(401, "Invalid credentials")
        if not verify_password(password, user.password_hash):
            raise AppError(401, "Invalid credentials")

        access_token = sign_access_token(str(user.id), user.role)
        refresh_token, expires_at = sign_refresh_token(str(user.id))
        await RefreshTokenRepository.create(user.id, hash_token(refresh_token), expires_at)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {"id": str(user.id), "email": user.email, "role": user.role},
        }

    # Rotation: the old refresh token is revoked and a new one issued on
    # every use
    async def refresh(refresh_token: str) -> dict:
        try:
            payload = decode_refresh_token(refresh_token)
        except Exception:
            raise AppError(401, "Invalid or expired refresh token")

        stored = await RefreshTokenRepository.find_valid_by_hash(hash_token(refresh_token))
        if not stored:
            raise AppError(401, "Refresh token has been revoked or is unknown")

        user = await UserRepository.find_by_id(payload["sub"])
        if not user:
            raise AppError(401, "User no longer exists")

        await RefreshTokenRepository.revoke_by_hash(hash_token(refresh_token))

        new_refresh_token, expires_at = sign_refresh_token(str(user.id))
        await RefreshTokenRepository.create(user.id, hash_token(new_refresh_token), expires_at)

        return {
            "access_token": sign_access_token(str(user.id), user.role),
            "refresh_token": new_refresh_token,
        }

    # Logs out a user by revoking the provided refresh token.
    @staticmethod
    async def logout(refresh_token: str) -> None:
        await RefreshTokenRepository.revoke_by_hash(hash_token(refresh_token))

    # Registers a new user with the provided email, password, role, 
    # and optional resource ID.
    @staticmethod
    async def register(email: str, password: str, role: str = "member", resource_id: int | None = None) -> dict:
        existing = await UserRepository.find_by_email(email)
        if existing:
            raise AppError(409, "Email already in use")
        user = await UserRepository.create(
            email=email.lower(), password_hash=hash_password(password), role=role, resource_id=resource_id
        )
        return {"id": str(user.id), "email": user.email, "role": user.role}
