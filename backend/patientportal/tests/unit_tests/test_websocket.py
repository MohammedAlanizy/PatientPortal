from fastapi import HTTPException
import pytest
import json

from app.core.roles import Role
from .test_requests_basic import test_create_request, test_update_request
from starlette.testclient import WebSocketDenialResponse

def test_websocket_connection_verifier(client, inserter_token, verifier_token, assignee_id, db):
    headers = {"Authorization": f"Bearer {inserter_token}"}
    # verifier should receive notifications for inserter requests
    try:
        with client.websocket_connect(f'api/v1/ws?token={verifier_token}') as websocket:
            
            # Create a new request to trigger notification
            request_data = {
                "full_name": "Test User",
                "national_id": 123456789,
                "medical_number": 987654321
            }
            
            response = client.post(
                "/api/v1/requests/",
                json=request_data,
                headers=headers
            )
            # Wait for notification (receive the message after posting the request)
            try:
                data = websocket.receive_json()
                assert data["type"] == "new_request"
            except Exception as e:
                pytest.fail(f"Did not receive websocket notification: {str(e)}")


    except Exception as e:
        pytest.fail(f"Could not establish websocket connection: {str(e)}")



def test_websocket_connection_inserter(client, verifier_token, inserter_token, assignee_id, db):
    headers = {"Authorization": f"Bearer {verifier_token}"}
    # inserter should receive notifications from verifier requests
    try:
        with client.websocket_connect(f'api/v1/ws?token={inserter_token}') as websocket:
            
            # Create a new request to trigger notification
            request_data = {
                "full_name": "Test User",
                "national_id": 123456789,
                "medical_number": 987654321
            }
            
            response = client.post(
                "/api/v1/requests/",
                json=request_data,
                headers=headers
            )
            # Wait for notification (receive the message after posting the request)
            try:
                data = websocket.receive_json()
                assert data["type"] == "new_request"
            except Exception as e:
                pytest.fail(f"Did not receive websocket notification: {str(e)}")


    except Exception as e:
        pytest.fail(f"Could not establish websocket connection: {str(e)}")



def test_websocket_connection_verifier_self(client, verifier_token, assignee_id, db):
    # Verifier should receive notifications for their own requests
    headers = {"Authorization": f"Bearer {verifier_token}"}
    
    try:
        with client.websocket_connect(f'api/v1/ws?token={verifier_token}') as websocket:
            
            # Create a new request to trigger notification
            request_data = {
                "full_name": "Test User",
                "national_id": 123456789,
                "medical_number": 987654321
            }
            
            response = client.post(
                "/api/v1/requests/",
                json=request_data,
                headers=headers
            )
            # Wait for notification (receive the message after posting the request)
            try:
                data = websocket.receive_json()
                assert data["type"] == "new_request"
            except Exception as e:
                pytest.fail(f"Did not receive websocket notification: {str(e)}")


    except Exception as e:
        pytest.fail(f"Could not establish websocket connection: {str(e)}")

def test_websocket_connection_inserter_self(client, inserter_token, assignee_id, db):
    # Inserter should receive notifications for their own requests
    headers = {"Authorization": f"Bearer {inserter_token}"}
    
    try:
        with client.websocket_connect(f'api/v1/ws?token={inserter_token}') as websocket:
            
            # Create a new request to trigger notification
            request_data = {
                "full_name": "Test User",
                "national_id": 123456789,
                "medical_number": 987654321
            }
            
            response = client.post(
                "/api/v1/requests/",
                json=request_data,
                headers=headers
            )
            # Wait for notification (receive the message after posting the request)
            try:
                data = websocket.receive_json()
                assert data["type"] == "new_request"
            except Exception as e:
                pytest.fail(f"Did not receive websocket notification: {str(e)}")


    except Exception as e:
        pytest.fail(f"Could not establish websocket connection: {str(e)}")

def test_websocket_connection_create_request(client, admin_token, assignee_id, db):
    
    try:
        with client.websocket_connect(f'api/v1/ws?token={admin_token}') as websocket:

            test_create_request(client, admin_token)
            try:
                data = websocket.receive_json()
                assert data["type"] == "new_request"
            except Exception as e:
                pytest.fail(f"Did not receive websocket notification: {str(e)}")



    except Exception as e:
        pytest.fail(f"Could not establish websocket connection: {str(e)}")



def test_websocket_connection_update_request(client, admin_token, assignee_id, db):
    
    try:
        with client.websocket_connect(f'api/v1/ws?token={admin_token}') as websocket:

            test_update_request(client, admin_token,assignee_id, db)
            try:
                data = websocket.receive_json()
                assert data["type"] == "new_request"
            except Exception as e:
                pytest.fail(f"Did not receive websocket notification: {str(e)}")

            try:
                data = websocket.receive_json()
                assert data["type"] == "updated_request"
            except Exception as e:
                pytest.fail(f"Did not receive websocket notification: {str(e)}")


    except Exception as e:
        pytest.fail(f"Could not establish websocket connection: {str(e)}")




def test_websocket_invalid(client ,create_expired_token, db):
    MOCK_TOKEN = create_expired_token

    try:
        # Attempt to connect with an invalid token (should raise WebSocketDenialResponse)
        with client.websocket_connect(f'/api/v1/ws?token={MOCK_TOKEN}') as websocket:
            assert False, "Connection should have failed with invalid token"

    except WebSocketDenialResponse as e:
        # Check that the WebSocket denial response has the correct status code and message
        assert e.status_code == 401  # Should match "Unauthorized"
        assert b'Could not validate credentials' in e.content  

    except Exception as e:
        pytest.fail(f"Unexpected error: {str(e)}")

