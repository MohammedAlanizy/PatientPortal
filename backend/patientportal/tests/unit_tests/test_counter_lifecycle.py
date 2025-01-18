import pytest
from app.schemas.request import Status


@pytest.mark.asyncio
async def test_request_lifecycle_for_last_counter(client, admin_token, verifier_token):
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    verifier_headers = {"Authorization": f"Bearer {verifier_token}"}
    
    # Helper function to create a request
    async def create_request():
        request_data = {
            "full_name": "Test User",
            "national_id": 123456789,
            "medical_number": 987654321
        }
        response = await client.post("/api/v1/requests/", json=request_data, headers=admin_headers)
        assert response.status_code == 200
        return response.json()

    # Helper function to complete a request
    async def complete_request(request_id, assignee_id):
        complete_data = {
            "assigned_to": assignee_id,
            "notes": "Work completed",
            "status": Status.COMPLETED
        }
        response = await client.put(
            f"/api/v1/requests/{request_id}",
            json=complete_data,
            headers=admin_headers
        )
        assert response.status_code == 200
        assert response.json()["status"] == Status.COMPLETED
        return response.json()

    # Create assignee
    assignee_response = await client.post(
        "/api/v1/assignees/",
        json={"full_name": "Test Assignee"},
        headers=admin_headers
    )
    assignee_id = assignee_response.json()["id"]

    # Create and assign requests
    request_response_1 = await create_request()
    request_id_1 = request_response_1["id"]
    assert request_response_1["status"] == Status.PENDING

    # Assign request to assignee (as verifier)
    update_data = {"assigned_to": assignee_id, "notes": "Initial assignment"}
    update_response = await client.put(
        f"/api/v1/requests/{request_id_1}",
        json=update_data,
        headers=verifier_headers
    )
    assert update_response.status_code == 200
    assert update_response.json()["notes"] == "Initial assignment"
    
    # Complete first request
    completed_request_1 = await complete_request(request_id_1, assignee_id)

    # Check counter after first request completion
    response = await client.get("/api/v1/counter/last")
    assert response.status_code == 200
    data = response.json()
    assert "request_id" in data
    assert "last_counter" in data
    assert data["request_id"] == request_id_1
    assert data["last_counter"] == 1

    # Create additional requests
    request_response_2 = await create_request()
    request_id_2 = request_response_2["id"]
    request_response_3 = await create_request()
    request_id_3 = request_response_3["id"]
    request_response_4 = await create_request()
    request_id_4 = request_response_4["id"]

    # Check counter after creating additional requests
    response = await client.get("/api/v1/counter/last")
    assert response.status_code == 200
    data = response.json()
    assert "last_counter" in data
    assert data["last_counter"] == 1  # No request completed yet

    # Complete second request
    completed_request_2 = await complete_request(request_id_4, assignee_id)
    
    # Check counter after completing second request
    response = await client.get("/api/v1/counter/last")
    assert response.status_code == 200
    data = response.json()
    assert "request_id" in data
    assert "last_counter" in data
    assert data["request_id"] == request_id_4
    assert data["last_counter"] == 4

    # Complete third request
    completed_request_3 = await complete_request(request_id_2, assignee_id)

    # Check counter after completing third request
    response = await client.get("/api/v1/counter/last")
    assert response.status_code == 200
    data = response.json()
    assert "request_id" in data
    assert "last_counter" in data
    assert data["request_id"] == request_id_2
    assert data["last_counter"] == 2

    # Complete fourth request
    completed_request_4 = await complete_request(request_id_3, assignee_id)

    # Check counter after completing fourth request
    response = await client.get("/api/v1/counter/last")
    assert response.status_code == 200
    data = response.json()
    assert "request_id" in data
    assert "last_counter" in data
    assert data["request_id"] == request_id_3
    assert data["last_counter"] == 3


@pytest.mark.asyncio
async def test_no_request_for_last_counter(client):
    response = await client.get("/api/v1/counter/last")
    assert response.status_code == 404