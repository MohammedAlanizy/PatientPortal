import pytest
from httpx import AsyncClient
from app.core.config import settings
@pytest.mark.asyncio
async def test_assignee_deletion_with_assigned_requests(client, admin_token, db):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create assignee
    assignee_data = {
        "full_name": "Test Assignee"
    }
    assignee_response = await client.post(
        "/api/v1/assignees/",
        json=assignee_data,
        headers=headers
    )
    assignee_id = assignee_response.json()["id"]
    
    # Create request and assign to assignee
    request_data = {
        "full_name": "Test User",
        "national_id": 123456789,
        "medical_number": 987654321
    }
    request_response = await client.post(
        "/api/v1/requests/",
        json=request_data,
        headers=headers
    )
    request_id = request_response.json()["id"]
    
    # Assign request to assignee
    update_data = {
        "assigned_to": assignee_id,
        "notes": "Assigned"
    }
    await client.put(
        f"/api/v1/requests/{request_id}",
        json=update_data,
        headers=headers
    )
    
    # Try to delete assignee
    response = await client.delete(
        f"/api/v1/assignees/{assignee_id}",
        headers=headers
    )
    
    assert response.status_code in [400, 200]


@pytest.mark.asyncio
async def test_assignee_pagination_edge_cases(client, admin_token, db):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create (settings.MAX_FETCH_LIMIT) assignees
    for i in range(settings.MAX_FETCH_LIMIT + 10):
        assignee_data = {
            "full_name": f"Test Assignee {i}"
        }
        await client.post(
        "/api/v1/assignees/",
        json=assignee_data,
        headers=headers
        )
    
    # Test the limit
    response = await client.get(f"/api/v1/assignees/?limit={settings.MAX_FETCH_LIMIT}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == settings.MAX_FETCH_LIMIT  # Should return all available assignees

@pytest.mark.asyncio
async def test_assignee_pagination_over_limit(client, admin_token, db):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create 15 assignees
    for i in range(15):
        assignee_data = {
            "full_name": f"Test Assignee {i}"
        }
        await client.post(
        "/api/v1/assignees/",
        json=assignee_data,
        headers=headers
        )
    
    # Test over the limit which should return an error
    response = await client.get(f"/api/v1/assignees/?limit={int(settings.MAX_FETCH_LIMIT) + 1}", headers=headers)
    assert response.status_code == 400
    assert "Limit must be less than or equal to" in response.json()["detail"]



    