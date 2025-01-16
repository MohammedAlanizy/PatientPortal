import pytest
from app.core.roles import Role
from app.schemas.request import Status

@pytest.mark.asyncio
async def test_role_based_request_limits(client, inserter_token):
    headers = {"Authorization": f"Bearer {inserter_token}"}
    
    # Test inserter role limit of 10 requests
    response = await client.get("/api/v1/requests/?limit=11", headers=headers)
    assert response.status_code == 400
    assert "Can't fetch more than 10 requests at a time for INSERTER role" in response.json()["detail"]

@pytest.mark.asyncio
async def test_role_based_request_update_by_inserter(client, inserter_token, assignee_id, db):
    headers = {"Authorization": f"Bearer {inserter_token}"}

    # Create request as inserter
    request_data = {
        "full_name": "Test User",
        "national_id": 123456789,
        "medical_number": 987654321
    }

    response = await client.post(
        "/api/v1/requests/",
        json=request_data,
        headers=headers
    )
    request_id = response.json()["id"]

    # Try to update request as inserter
    update_data = {
        "notes": "Try to update request as inserter",
        "assigned_to": assignee_id
    }
    response = await client.put(
        f"/api/v1/requests/{request_id}",
        json=update_data,
        headers=headers
    )

    assert response.status_code == 403
    assert "User does not have the required role" in response.json()["detail"]

@pytest.mark.asyncio
async def test_completed_request_update_restrictions(client, verifier_token, admin_token, assignee_id, db):
    # Create request as admin
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    request_data = {
        "full_name": "Test User",
        "national_id": 123456789,
        "medical_number": 987654321
    }
    
    response = await client.post(
        "/api/v1/requests/",
        json=request_data,
        headers=admin_headers
    )
    request_id = response.json()["id"]
    
    # Complete the request
    update_data = {
        "assigned_to": assignee_id,
        "status": Status.COMPLETED
    }
    await client.put(
        f"/api/v1/requests/{request_id}",
        json=update_data,
        headers=admin_headers
    )
    
    # Try to update completed request as verifier
    verifier_headers = {"Authorization": f"Bearer {verifier_token}"}
    update_data = {
        "notes": "Try to update completed request",
        "assigned_to": assignee_id
    }
    response = await client.put(
        f"/api/v1/requests/{request_id}",
        json=update_data,
        headers=verifier_headers
    )
    
    assert response.status_code == 403
    assert "Only admin can edit completed requests" in response.json()["detail"]

@pytest.mark.asyncio
@pytest.mark.parametrize("endpoint, method, role, expected_status, payload", [
    ("/api/v1/requests/", "GET", Role.ADMIN, 200, {}),
    ("/api/v1/requests/", "GET", Role.VERIFIER, 200, {"limit": 10}),
    ("/api/v1/requests/?limit=10", "GET", Role.INSERTER, 200, {}),
    ("/api/v1/assignees/", "POST", Role.ADMIN, 200, {"full_name": "Test Assignee"}),
    ("/api/v1/assignees/", "POST", Role.VERIFIER, 403, {"full_name": "Test Assignee"}),
    ("/api/v1/assignees/", "POST", Role.INSERTER, 403, {"full_name": "Test Assignee"}),
    ("/api/v1/requests/stats", "GET", Role.ADMIN, 200, {}),
    ("/api/v1/requests/stats", "GET", Role.VERIFIER, 200, {}),
    ("/api/v1/requests/stats", "GET", Role.INSERTER, 403, {}),
    ("api/v1/users/", "GET", Role.ADMIN, 200, {}),
    ("api/v1/users/", "GET", Role.VERIFIER, 403, {}),
    ("api/v1/users/", "GET", Role.INSERTER, 403, {}),
    ("/api/v1/users/", "POST", Role.ADMIN, 200, {"username": "testuser", "password": "testpass", "role": Role.ADMIN}),
    ("/api/v1/users/", "POST", Role.VERIFIER, 403, {"username": "testuser", "password": "testpass", "role": Role.ADMIN}),
    ("/api/v1/users/", "POST", Role.INSERTER, 403, {"username": "testuser", "password": "testpass", "role": Role.ADMIN}),
])
async def test_role_based_permissions(client, admin_token, verifier_token, inserter_token, endpoint, method, role, expected_status, payload):
    token_map = {
        Role.ADMIN: admin_token,
        Role.VERIFIER: verifier_token,
        Role.INSERTER: inserter_token
    }
    
    headers = {"Authorization": f"Bearer {token_map[role]}"}
    
    if method == "GET":
        response = await client.get(endpoint, headers=headers)
    elif method == "POST":
        response = await client.post(endpoint, json=payload, headers=headers)
    elif method == "DELETE":
        response = await client.delete(endpoint, headers=headers)
    
    print(response.json())
    assert response.status_code == expected_status