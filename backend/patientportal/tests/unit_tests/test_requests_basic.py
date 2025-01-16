import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_request(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    request_data = {
        "full_name": "Test User",
        "national_id": 123456789,
        "medical_number": 987654321
    }
    for i in range(10000):
        response = await client.post(
            "/api/v1/requests/",
            json=request_data,
            headers=headers
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == request_data["full_name"]
    assert data["national_id"] == request_data["national_id"]
    assert data["medical_number"] == request_data["medical_number"]

@pytest.mark.asyncio
async def test_get_requests_admin(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    response = await client.get("/api/v1/requests/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "remaining" in data

@pytest.mark.asyncio
async def test_get_requests_unauthorized(client):
    response = await client.get("/api/v1/requests/")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_update_request(client, admin_token, assignee_id, db):
    # First create a request
    headers = {"Authorization": f"Bearer {admin_token}"}

    initial_request = {
        "full_name": "Test User",
        "national_id": 12345678901,
        "medical_number": 98765432101
    }
    
    create_response = await client.post(
        "/api/v1/requests/",
        json=initial_request,
        headers=headers
    )
    request_id = create_response.json()["id"]
    
    # Now update it
    update_data = {
        "medical_number": 111222333444,
        "notes": "Updated notes",
        "assigned_to": assignee_id
    }
    
    response = await client.put(
        f"/api/v1/requests/{request_id}",
        json=update_data,
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["medical_number"] == update_data["medical_number"]
    assert data["notes"] == update_data["notes"]