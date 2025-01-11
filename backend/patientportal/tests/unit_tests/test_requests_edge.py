from app.schemas.request import Status


def test_request_with_special_characters(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    request_data = {
        "full_name": "Test@User#$%",
        "national_id": 123456789,
        "medical_number": 987654321
    }
    
    response = client.post(
        "/api/v1/requests/",
        json=request_data,
        headers=headers
    )
    
    assert response.status_code == 200
    assert response.json()["full_name"] == "Test@User#$%"

def test_request_pagination_edge_cases(client, admin_token, db):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create 15 requests
    for i in range(15):
        request_data = {
            "full_name": f"Test User {i}",
            "national_id": 1000000 + i,
            "medical_number": 2000000 + i
        }
        client.post("/api/v1/requests/", json=request_data, headers=headers)
    
    # Test very large limit
    response = client.get("/api/v1/requests/?limit=1000000", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 15  # Should return all available requests

def test_request_concurrent_updates(client, admin_token, assignee_id, db):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create initial request
    initial_request = {
        "full_name": "Test User",
        "national_id": 123456789,
        "medical_number": 987654321
    }
    
    response = client.post(
        "/api/v1/requests/",
        json=initial_request,
        headers=headers
    )
    request_id = response.json()["id"]
    
    # Simulate concurrent updates
    update_data_1 = {
        "medical_number": 111111,
        "notes": "Update 1",
        "assigned_to": assignee_id
    }
    
    update_data_2 = {
        "medical_number": 222222,
        "notes": "Update 2",
        "assigned_to": assignee_id
    }
    
    response1 = client.put(
        f"/api/v1/requests/{request_id}",
        json=update_data_1,
        headers=headers
    )
    response2 = client.put(
        f"/api/v1/requests/{request_id}",
        json=update_data_2,
        headers=headers
    )
    
    assert response1.status_code == 200
    assert response2.status_code == 200
    
    # Verify final state
    final_response = client.get(f"/api/v1/requests/{request_id}", headers=headers)
    assert final_response.json()["medical_number"] == 222222






def test_request_lifecycle(client, admin_token, verifier_token):
    """Test complete lifecycle of a request including creation, assignment, updates, and completion"""
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    verifier_headers = {"Authorization": f"Bearer {verifier_token}"}
    
    #  Create assignee
    assignee_response = client.post(
        "/api/v1/assignees/",
        json={"full_name": "Test Assignee"},
        headers=admin_headers
    )
    assignee_id = assignee_response.json()["id"]
    
    # Create request
    request_data = {
        "full_name": "Test User",
        "national_id": 123456789,
        "medical_number": 987654321
    }
    request_response = client.post("/api/v1/requests/", json=request_data, headers=admin_headers)
    request_id = request_response.json()["id"]
    assert request_response.json()["status"] == Status.PENDING
    
    #  Assign request to assignee (as verifier)
    update_data = {
        "assigned_to": assignee_id,
        "notes": "Initial assignment"
    }
    update_response = client.put(
        f"/api/v1/requests/{request_id}",
        json=update_data,
        headers=verifier_headers
    )
    assert update_response.status_code == 200
    
    #  Complete request (as admin)
    complete_data = {
        "assigned_to": assignee_id,
        "notes": "Work completed",
        "status": Status.COMPLETED
    }
    complete_response = client.put(
        f"/api/v1/requests/{request_id}",
        json=complete_data,
        headers=admin_headers
    )
    assert complete_response.status_code == 200
    assert complete_response.json()["status"] == Status.COMPLETED
    
    #  Verify request appears in stats
    stats_response = client.get("/api/v1/requests/stats", headers=admin_headers)
    stats = stats_response.json()
    assert stats["completed"] > 0