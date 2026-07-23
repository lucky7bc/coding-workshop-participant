from datetime import datetime, timezone

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel


# RefreshToken model for managing refresh tokens in the database.
class RefreshToken(Document):
    """Access tokens stay stateless (short TTL, unrevoked until expiry —
    accepted tradeoff). Refresh tokens must be persisted because logout
    requires server-side invalidation. token_hash stores a SHA-256 hash,
    never the raw token."""

    user_id: PydanticObjectId
    token_hash: str
    expires_at: datetime
    revoked: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "refresh_tokens"
        indexes = [IndexModel("token_hash"), IndexModel("user_id")]
