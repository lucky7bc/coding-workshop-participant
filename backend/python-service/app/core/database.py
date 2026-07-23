# This module handles database connections and initialization for the application.

from typing import Optional

from beanie import init_beanie
from pymongo import AsyncMongoClient

from app.core.config import settings
from app.models.counter import Counter
from app.models.deliverable import Deliverable
from app.models.initiative import Initiative
from app.models.milestone import Milestone
from app.models.refresh_token import RefreshToken
from app.models.resource import Resource
from app.models.user import User

_client: Optional[AsyncMongoClient] = None


# _build_mongo_kwargs constructs the keyword arguments for the 
# AsyncMongoClient based on the application settings.
def _build_mongo_kwargs() -> dict:
    """
    Mirrors backend/_examples/python-service/mongo_service.py's exact
    conditional pattern, verified against that file directly rather than
    reinvented:
      - username/password/authSource are only added when MONGO_USER is
        set — i.e. only for the cloud/DocumentDB target. Locally there's
        no auth.
      - tls/tlsAllowInvalidCertificates/retryWrites are only added when
        NOT is_local — DocumentDB requires TLS, local mongod doesn't.
    """
    kwargs: dict = {
        "host": settings.mongo_host,
        "port": settings.mongo_port,
        "serverSelectionTimeoutMS": 5000,
        "socketTimeoutMS": 45000,
    }
    if settings.mongo_user:
        kwargs.update(
            username=settings.mongo_user,
            password=settings.mongo_pass,
            authSource=settings.mongo_name or "admin",
        )
    if not settings.is_local:
        kwargs.update(tls=True, tlsAllowInvalidCertificates=True, retryWrites=False)
    return kwargs

# Initializes the database connection and sets up 
# Beanie ODM with the specified document models.
async def connect_db() -> None:
    global _client
    _client = AsyncMongoClient(**_build_mongo_kwargs())

    database = _client[settings.mongo_database_name]

    await init_beanie(
        database=database,
        document_models=[Counter, User, RefreshToken, Resource, Initiative, Milestone, Deliverable],
    )


# Returns the initialized AsyncMongoClient instance. 
# Raises a RuntimeError if the database has not been initialized yet.
def get_db_client() -> AsyncMongoClient:
    if _client is None:
        raise RuntimeError("Database not initialized — connect_db() must run before get_db_client() is used")
    return _client
