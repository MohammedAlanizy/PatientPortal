# conftest.py
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

@pytest.fixture(autouse=True)
def override_settings_for_testing():
    # Override the TESTING value in settings
    settings.TESTING = True

DATABASE_URL = "sqlite:///test.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def admin_token(client, db):
    # Create admin user
    user_in = UserCreate(
        username="admin",
        password="adminpass",
        role=Role.ADMIN
    )
    crud_user.create(db, obj_in=user_in)
    
    # Login to get token
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin", "password": "adminpass"}
    )
    return response.json()["access_token"]

@pytest.fixture
def verifier_token(client, db):
    user_in = UserCreate(
        username="verifier",
        password="verifierpass",
        role=Role.VERIFIER
    )
    crud_user.create(db, obj_in=user_in)
    
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "verifier", "password": "verifierpass"}
    )
    return response.json()["access_token"]

@pytest.fixture
def inserter_token(client, db):
    user_in = UserCreate(
        username="inserter",
        password="inserterpass",
        role=Role.INSERTER
    )
    crud_user.create(db, obj_in=user_in)
    
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "inserter", "password": "inserterpass"}
    )
    return response.json()["access_token"]


@pytest.fixture
def assignee_id(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    assignee_data = {
        "full_name": "Test Assignee"
    }
    
    create_response = client.post(
        "/api/v1/assignees/",
        json=assignee_data,
        headers=headers
    )
    return create_response.json()["id"]


@pytest.fixture
def user_id(db):
    # Create and return a user ID (for testing purposes)
    user_in = UserCreate(username="testuser", password="testpass", role=Role.ADMIN)
    user = crud_user.create(db, obj_in=user_in)
    return user.id

@pytest.fixture
def role():
    return Role.ADMIN


@pytest.fixture
def create_expired_token(user_id, role):
    expire = datetime.now(timezone.utc) - timedelta(minutes=30)
    return create_access_token(user_id, role, expires_delta=timedelta(minutes=-30))