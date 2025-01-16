import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_assignee(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    assignee_data = {
        "full_name": "Test Assignee"
    }
    
    response = await client.post(
        "/api/v1/assignees/",
        json=assignee_data,
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == assignee_data["full_name"]
    assert data["id"] is not None

@pytest.mark.asyncio
async def test_get_assignees(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    response = await client.get("/api/v1/assignees/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "remaining" in data

@pytest.mark.asyncio
async def test_update_assignee(client, admin_token):
    # First create an assignee
    headers = {"Authorization": f"Bearer {admin_token}"}
    initial_assignee = {
        "full_name": "Test Assignee"
    }
    
    create_response = await client.post(
        "/api/v1/assignees/",
        json=initial_assignee,
        headers=headers
    )
    assignee_id = create_response.json()["id"]
    
    # Now update it
    update_data = {
        "full_name": "Updated Assignee"
    }
    
    response = await client.put(
        f"/api/v1/assignees/{assignee_id}",
        json=update_data,
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == update_data["full_name"]

@pytest.mark.asyncio
async def test_delete_assignee(client, admin_token):
    # First create an assignee
    headers = {"Authorization": f"Bearer {admin_token}"}
    assignee_data = {
        "full_name": "Test Assignee"
    }
    
    create_response = await client.post(
        "/api/v1/assignees/",
        json=assignee_data,
        headers=headers
    )
    assignee_id = create_response.json()["id"]
    
    # Now delete it
    response = await client.delete(
        f"/api/v1/assignees/{assignee_id}",
        headers=headers
    )
    
    assert response.status_code == 200
    
    # Verify it's deleted
    get_response = await client.get(
        f"/api/v1/assignees/{assignee_id}",
        headers=headers
    )
    assert get_response.status_code == 404