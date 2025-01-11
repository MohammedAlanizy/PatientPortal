def test_request_stats(client, admin_token, db):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create some test requests
    request_data = {
        "full_name": "Test User",
        "national_id": 123456789,
        "medical_number": 987654321
    }
    
    client.post("/api/v1/requests/", json=request_data, headers=headers)
    
    response = client.get("/api/v1/requests/stats", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "completed" in data
    assert "pending" in data

def test_assignee_stats(client, admin_token, db):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create test assignee
    assignee_data = {
        "full_name": "Test Assignee"
    }
    
    client.post("/api/v1/assignees/", json=assignee_data, headers=headers)
    
    response = client.get("/api/v1/assignees/stats", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "stats" in data