# This module defines the application settings using Pydantic's BaseSettings,

from pydantic_settings import BaseSettings, SettingsConfigDict


# The Settings class defines the configuration for the application, 
# including database and JWT settings.
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 4000

    is_local: bool = True
    mongo_host: str = "localhost"
    mongo_port: int = 27017
    mongo_name: str = ""  # empty locally per the docs table — see database.py
    mongo_user: str = ""
    mongo_pass: str = ""

    mongo_database_name: str = "initiative_tracking_system"

    jwt_access_secret: str
    jwt_refresh_secret: str
    jwt_access_ttl_minutes: int = 15
    jwt_refresh_ttl_days: int = 7


settings = Settings()
