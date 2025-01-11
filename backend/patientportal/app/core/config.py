from pydantic_settings import BaseSettings
from typing import Optional, Dict, Any, List, ClassVar
from functools import lru_cache
from pydantic import ConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Medical Request System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # Database
    DATABASE_URL: str = "sqlite:///./default.db"
    
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

    Config: ClassVar[ConfigDict] = ConfigDict(case_sensitive=True, env_file=".env")


@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()