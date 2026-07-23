from datetime import datetime, timezone

from beanie import PydanticObjectId

from app.models.refresh_token import RefreshToken

# Repository for handling refresh token-related database operations
class RefreshTokenRepository:
    # Creates a new refresh token record for a user with the 
    # specified token hash and expiration time.
    @staticmethod
    async def create(user_id: PydanticObjectId, token_hash: str, expires_at: datetime) -> RefreshToken:
        record = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        await record.insert()
        return record

    # Finds a valid (not revoked and not expired) refresh token by its hash.
    @staticmethod
    async def find_valid_by_hash(token_hash: str) -> RefreshToken | None:
        return await RefreshToken.find_one(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,  # noqa: E712 — Beanie query syntax requires ==, not `is`
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )

    # Revokes a refresh token by its hash, marking it as revoked 
    # in the database.
    @staticmethod
    async def revoke_by_hash(token_hash: str) -> None:
        await RefreshToken.find_one(RefreshToken.token_hash == token_hash).update({"$set": {"revoked": True}})

    # Revokes all refresh tokens associated with a specific user, 
    #marking them as revoked in the database.
    @staticmethod
    async def revoke_all_for_user(user_id: PydanticObjectId) -> None:
        await RefreshToken.find(RefreshToken.user_id == user_id).update({"$set": {"revoked": True}})
