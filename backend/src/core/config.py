from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    app_name: str = "Enterprise Ticketing System"
    mongodb_uri: str = Field(..., alias="MONGODB_URI")  # Required from env variable

    class Config:
        env_file = ".env"  # Load from a .env file (recommended for local dev)
        case_sensitive = True
settings = Settings()