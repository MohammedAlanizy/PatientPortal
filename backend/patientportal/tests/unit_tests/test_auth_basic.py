from app.core.roles import Role
from app.crud import crud_user
from app.schemas.user import UserCreate


def test_login_success(client, db):
    # Create a test user
    user_in = UserCreate(
        username="testuser",
        password="testpass",
        role=Role.ADMIN
    )
    crud_user.create(db, obj_in=user_in)
    
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser", "password": "testpass"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["role"] == Role.ADMIN

def test_login_invalid_credentials(client):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "wronguser", "password": "wrongpass"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect username or password"