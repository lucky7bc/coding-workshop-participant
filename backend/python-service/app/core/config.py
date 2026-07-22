from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 4000

    # Workshop-injected Lambda environment contract (docs/full-stack.md,
    # "Database Environment Variables") — five discrete vars, not one
    # connection string like our original standalone build used.
    is_local: bool = True
    mongo_host: str = "localhost"
    mongo_port: int = 27017
    mongo_name: str = ""  # empty locally per the docs table — see database.py
    mongo_user: str = ""
    mongo_pass: str = ""

    # Not part of the workshop's env contract — our own fallback for the
    # working database name when MONGO_NAME is empty (local dev).
    mongo_database_name: str = "initiative_tracking_system"

    jwt_access_secret: str
    jwt_refresh_secret: str
    jwt_access_ttl_minutes: int = 15
    jwt_refresh_ttl_days: int = 7


settings = Settings()
