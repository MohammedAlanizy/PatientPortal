import pytest
from datetime import datetime
from app.schemas.request import Status
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_request_complex_filtering(client, admin_token, db):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create requests with different statuses and dates
    for i in range(5):
        request_data = {
            "full_name": f"Test User {i}",
            "national_id": 1000000 + i,
            "medical_number": 2000000 + i,
            "status": Status.PENDING if i % 2 == 0 else Status.COMPLETED
        }
        await client.post("/api/v1/requests/", json=request_data, headers=headers)
    
    # Test filtering by status
    response = await client.get(
        f"/api/v1/requests/?status={Status.PENDING.value}",
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert all(r["status"] == Status.PENDING for r in data["results"])
    
    # Test filtering by date range
    today = datetime.now().isoformat()
    response = await client.get(
        f"/api/v1/requests/?start_date={today}&end_date={today}",
        headers=headers
    )
    assert response.status_code == 200
    
    # Test invalid date format (which should be handled in the backend!)
    response = await client.get(
        "/api/v1/requests/?start_date=invalid-date",
        headers=headers
    )
    assert response.status_code == 200