

# test_users test cases : 

from app.core.roles import Role
from app.crud import crud_user
from app.schemas.user import UserCreate


def test_get_users(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    response = client.get("/api/v1/users/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "remaining" in data

def test_delete_user(client, admin_token):
    # First create a user
    headers = {"Authorization": f"Bearer {admin_token}"}
    user_data = {
        "username": "Test User",
        "password": "Test Password",
        "role": "admin"
    }

    create_response = client.post(
        "/api/v1/users/",
        json=user_data,
        headers=headers
    )
    user_id = create_response.json()["id"]

    # Now delete it
    response = client.delete(
        f"/api/v1/users/{user_id}",
        headers=headers
    )

    assert response.status_code == 200



def test_delete_themselves(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}


    response = client.delete(
        "/api/v1/users/1",
        headers=headers
    )
    assert response.status_code == 400
    assert "Can't delete yourself" in response.json()["detail"]


def test_delete_guest_user(client, admin_token, db):
    headers    = {"Authorization": f"Bearer {admin_token}"}

    # Create guest user, this is done in the main app. 
    user_in = UserCreate(
        username="guest",
        password="guestpass",
        role=Role.INSERTER,
    )
    crud_user.create_guest_user(db, obj_in=user_in)


    response = client.delete(
        "/api/v1/users/2",
        headers=headers
    )
    assert response.status_code == 400
    assert "Can't delete guest user" in response.json()["detail"]
    
