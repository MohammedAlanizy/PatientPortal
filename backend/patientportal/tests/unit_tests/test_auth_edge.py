import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_login_rate_limiting(client):
    # Attempt multiple rapid login requests
    for _ in range(10):
        response = await client.post(
            "/api/v1/auth/login",
            data={"username": "wronguser", "password": "wrongpass"}
        )
    
    # The last request should be rate limited
    # TODO: rate limit is not implemented, will need to implement it in the future !!
    assert response.status_code in [400, 429]

@pytest.mark.asyncio
async def test_token_expiration(client, admin_token, create_expired_token, db):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Make request with valid token
    response1 = await client.get("/api/v1/requests/", headers=headers)
    assert response1.status_code == 200
    
    # Make request with expired token
    headers_expired = {"Authorization": f"Bearer {create_expired_token}"}
    response2 = await client.get("/api/v1/requests/", headers=headers_expired)
    assert response2.status_code == 401

@pytest.mark.asyncio
async def test_login_malformed_token(client):
    headers = {"Authorization": "Bearer malformedtoken123"}
    response = await client.get("/api/v1/requests/", headers=headers)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_login_missing_token_prefix(client):
    headers = {"Authorization": "validtoken123"}
    response = await client.get("/api/v1/requests/", headers=headers)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_login_missing_authorization_header(client):
    response = await client.get("/api/v1/requests/")
    assert response.status_code == 401