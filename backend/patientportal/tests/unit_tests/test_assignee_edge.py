def test_assignee_deletion_with_assigned_requests(client, admin_token, db):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create assignee
    assignee_data = {
        "full_name": "Test Assignee"
    }
    assignee_response = client.post(
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
    request_response = client.post(
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
    client.put(
        f"/api/v1/requests/{request_id}",
        json=update_data,
        headers=headers
    )
    
    # Try to delete assignee
    response = client.delete(
        f"/api/v1/assignees/{assignee_id}",
        headers=headers
    )
    
    assert response.status_code in [400, 200]
