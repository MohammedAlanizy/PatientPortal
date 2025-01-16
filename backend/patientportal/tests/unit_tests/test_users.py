import pytest
from app.core.roles import Role
from app.crud import crud_user
from app.schemas.user import UserCreate
from app.core.config import settings


@pytest.mark.asyncio
async def test_get_users(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    response = await client.get("/api/v1/users/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "remaining" in data

@pytest.mark.asyncio
async def test_delete_user(client, admin_token):
    # First create a user
    headers = {"Authorization": f"Bearer {admin_token}"}
    user_data = {
        "username": "Test User",
        "password": "Test Password",
        "role": "admin"
    }

    create_response = await client.post(
        "/api/v1/users/",
        json=user_data,
        headers=headers
    )
    user_id = create_response.json()["id"]

    # Now delete it
    response = await client.delete(
        f"/api/v1/users/{user_id}",
        headers=headers
    )

    assert response.status_code == 200

@pytest.mark.asyncio
async def test_delete_themselves(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = await client.delete(
        "/api/v1/users/1",
        headers=headers
    )
    assert response.status_code == 400
    assert "Can't delete yourself" in response.json()["detail"]

@pytest.mark.asyncio
async def test_delete_guest_user(client, admin_token, db):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create guest user
    user_in = UserCreate(
        username="guest",
        password="guestpass",
        role=Role.INSERTER,
    )
    await crud_user.create_guest_user(db, obj_in=user_in)

    response = await client.delete(
        "/api/v1/users/2",
        headers=headers
    )
    assert response.status_code == 400
    assert "Can't delete guest user" in response.json()["detail"]



@pytest.mark.asyncio
async def test_users_pagination_edge_cases(client, admin_token, db):
    # This test case is might to take a long time to run 
    # due to the large number of users created
    # but it's necessary to test the edge cases
    # so we will keep it as is
    # and we will run it only when we need to test the edge cases
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Set the limit to the maximum fetch limit (100 to test small number of users)
    if settings.MAX_FETCH_LIMIT > 100:
        settings.MAX_FETCH_LIMIT = 100

    # Create (settings.MAX_FETCH_LIMIT) users
    for i in range(settings.MAX_FETCH_LIMIT + 10):
        users_data = {
            "username": f"Test User {i}",
            "password": "Test Password",
            "role": "admin"
        }
        await client.post(
        "/api/v1/users/",
        json=users_data,
        headers=headers
        )
    
    # Test the limit
    response = await client.get(f"/api/v1/users/?limit={settings.MAX_FETCH_LIMIT}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == settings.MAX_FETCH_LIMIT  # Should return all available assignees

@pytest.mark.asyncio
async def test_users_pagination_over_limit(client, admin_token, db):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create 15 users
    for i in range(15):
        assignee_data = {
            "username": "Test User",
            "password": "Test Password",
            "role": "admin"
        }
        await client.post(
        "/api/v1/users/",
        json=assignee_data,
        headers=headers
        )
    
    # Test over the limit which should return an error
    response = await client.get(f"/api/v1/users/?limit={int(settings.MAX_FETCH_LIMIT) + 1}", headers=headers)
    assert response.status_code == 400
    assert "Limit must be less than or equal to" in response.json()["detail"]