# conftest.py
import asyncio
from httpx import ASGITransport, AsyncClient
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.api.deps import get_db
from app.main import app
from app.crud.crud_user import crud_user
from app.schemas.user import UserCreate
from app.core.roles import Role
from app.core.config import settings, get_settings
from app.core.config import Settings
from datetime import datetime, timedelta, timezone
from app.core.security import create_access_token
import pytest
import pytest_asyncio
from typing import AsyncGenerator, AsyncIterator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from httpx import AsyncClient

# Test database URL
# DATABASE_URL = "postgresql+asyncpg://user:password@localhost:5432/test_db"

# Create async engine for tests
test_engine = create_async_engine(
    str(settings.DATABASE_URL),
    poolclass=StaticPool
)

# Create test session factory
AsyncTestingSessionLocal = sessionmaker(
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# Database fixture
@pytest_asyncio.fixture(scope="function")
async def db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncTestingSessionLocal() as session:
        yield session

    # Clean up database after test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

# Client fixture
@pytest_asyncio.fixture(scope="function")
async def client(db: AsyncSession):
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()

@pytest_asyncio.fixture(scope="function")
async def admin_token(client: AsyncClient, db: AsyncSession):
    user_in = UserCreate(username="admin", password="adminpass", role=Role.ADMIN)
    user = await crud_user.create(db, obj_in=user_in)
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "adminpass"},
    )
    return response.json()["access_token"]

@pytest_asyncio.fixture(scope="function")
async def verifier_token(client: AsyncClient, db: AsyncSession):
    user_in = UserCreate(username="verifier", password="verifierpass", role=Role.VERIFIER)
    user = await crud_user.create(db, obj_in=user_in)
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "verifier", "password": "verifierpass"},
    )
    return response.json()["access_token"]

@pytest_asyncio.fixture(scope="function")
async def inserter_token(client: AsyncClient, db: AsyncSession):
    user_in = UserCreate(username="inserter", password="inserterpass", role=Role.INSERTER)
    user = await crud_user.create(db, obj_in=user_in)
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "inserter", "password": "inserterpass"},
    )
    return response.json()["access_token"]



@pytest_asyncio.fixture(scope="function")
async def assignee_id(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    assignee_data = {
        "full_name": "Test Assignee"
    }
    
    create_response = await client.post(
        "/api/v1/assignees/",
        json=assignee_data,
        headers=headers
    )
    return create_response.json()["id"]


@pytest_asyncio.fixture(scope="function")
async def user_id(db):
    # Create and return a user ID (for testing purposes)
    user_in = UserCreate(username="testuser", password="testpass", role=Role.ADMIN)
    user = await crud_user.create(db, obj_in=user_in)
    return user.id

@pytest.fixture
def role():
    return Role.ADMIN


@pytest.fixture
def create_expired_token(user_id, role):
    expire = datetime.now(timezone.utc) - timedelta(minutes=30)
    return create_access_token(user_id, role, expires_delta=timedelta(minutes=-30))