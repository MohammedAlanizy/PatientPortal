import pytest
from fastapi import FastAPI
from httpx import AsyncClient
import asyncio
from async_asgi_testclient import TestClient # We need to use this instead of httpx.AsyncClient, as it doesn't support websockets
import json
from app.main import app

@pytest.mark.asyncio
async def test_websocket_connection_verifier(client, inserter_token, verifier_token, assignee_id, db):
    async with TestClient(app) as test_client:
        async with test_client.websocket_connect(f"/api/v1/ws?token={verifier_token}") as ws:
            # Create a new request to trigger notification
            headers = {"Authorization": f"Bearer {inserter_token}"}
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
            
            # Wait for notification
            data = await ws.receive_json()
            assert data["type"] == "new_request"

@pytest.mark.asyncio
async def test_websocket_connection_inserter(client, verifier_token, inserter_token, assignee_id, db):
    async with TestClient(app) as test_client:
        async with test_client.websocket_connect(f"/api/v1/ws?token={inserter_token}") as ws:
            headers = {"Authorization": f"Bearer {verifier_token}"}
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
            
            data = await ws.receive_json()
            assert data["type"] == "new_request"

@pytest.mark.asyncio
async def test_websocket_connection_verifier_self(client, verifier_token, assignee_id, db):
    async with TestClient(app) as test_client:
        async with test_client.websocket_connect(f"/api/v1/ws?token={verifier_token}") as ws:
            headers = {"Authorization": f"Bearer {verifier_token}"}
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
            
            data = await ws.receive_json()
            assert data["type"] == "new_request"

@pytest.mark.asyncio
async def test_websocket_connection_inserter_self(client, inserter_token, assignee_id, db):
    async with TestClient(app) as test_client:
        async with test_client.websocket_connect(f"/api/v1/ws?token={inserter_token}") as ws:
            headers = {"Authorization": f"Bearer {inserter_token}"}
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
            
            data = await ws.receive_json()
            assert data["type"] == "new_request"

@pytest.mark.asyncio
async def test_websocket_connection_create_request(client, admin_token, assignee_id, db):
    async with TestClient(app) as test_client:
        async with test_client.websocket_connect(f"/api/v1/ws?token={admin_token}") as ws:
            headers = {"Authorization": f"Bearer {admin_token}"}
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
            
            data = await ws.receive_json()
            assert data["type"] == "new_request"

@pytest.mark.asyncio
async def test_websocket_connection_update_request(client, admin_token, assignee_id, db):
    async with TestClient(app) as test_client:
        async with test_client.websocket_connect(f"/api/v1/ws?token={admin_token}") as ws:
            headers = {"Authorization": f"Bearer {admin_token}"}
            
            # First create a request
            request_data = {
                "full_name": "Test User",
                "national_id": 123456789,
                "medical_number": 987654321
            }
            
            create_response = await client.post(
                "/api/v1/requests/",
                json=request_data,
                headers=headers
            )
            response_json = create_response.json()
            request_id = response_json["id"]

            # Wait for new request notification
            data = await ws.receive_json()
            assert data["type"] == "new_request"

            # Update the request
            update_data = {
                "medical_number": 111222333,
                "notes": "Updated notes",
                "assigned_to": assignee_id
            }
            
            await client.put(
                f"/api/v1/requests/{request_id}",
                json=update_data,
                headers=headers
            )

            # Wait for update notification
            data = await ws.receive_json()
            assert data["type"] == "updated_request"



# The below test case is a dumb way to test for invalid token
# It is not recommended to use this in production code (as it is not a good practice to test for exceptions)    
# I used this test case because I didn't have time to implement a better way to test for invalid token ()
@pytest.mark.asyncio
async def test_websocket_invalid(client, create_expired_token, db):
    async with TestClient(app) as test_client:
        try:
            async with test_client.websocket_connect(f"/api/v1/ws?token={create_expired_token}") as ws:
                pytest.fail("Connection should have failed with invalid token")
        except Exception as e:
            assert True 