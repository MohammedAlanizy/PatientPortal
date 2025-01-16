from pydantic_settings import BaseSettings
from typing import Optional, Dict, Any, List, ClassVar
from functools import lru_cache
from pydantic import ConfigDict, PostgresDsn, Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Medical Request System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # Database
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5433"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "MySuperSecurePassword"
    POSTGRES_DB: str = "medical_requests"
    
    DATABASE_URL: Optional[PostgresDsn] = Field(default=None, env="DATABASE_URL") 
    

    # ADMIN_USERNAME 
    ADMIN_USERNAME: str = "admin"

    # ADMIN_PASSWORD
    ADMIN_PASSWORD: str = "admin"

    # Frontend URL
    FRONTEND_URL: str = "http://localhost:3000"
    
    # JWT
    SECRET_KEY: str = "SECRET_KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Password hashing
    BCRYPT_ROUNDS: int = 12
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # Testing
    TESTING: bool = False

    # Config

    Config: ClassVar[ConfigDict] = ConfigDict(case_sensitive=True, env_file=".env")


    # Limit of fetching data
    MAX_FETCH_LIMIT: int = 100

    def build_database_url(self) -> None:
        if not self.DATABASE_URL:
            self.DATABASE_URL = PostgresDsn.build(
                scheme="postgresql+asyncpg",
                username=self.POSTGRES_USER,
                password=self.POSTGRES_PASSWORD,
                host=self.POSTGRES_HOST,
                port=int(self.POSTGRES_PORT),
                path=self.POSTGRES_DB,
            )
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL is required but not set in the environment or config.")


@lru_cache()
def get_settings():
    settings = Settings()
    settings.build_database_url()
    return settings

settings = get_settings()