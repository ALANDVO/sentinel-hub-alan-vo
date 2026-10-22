import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "sentinel-hub-alan-vo"


@pytest.mark.asyncio
async def test_readiness_check(client):
    response = await client.get("/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert "ready" in data


@pytest.mark.asyncio
async def test_root(client):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "sentinel-hub-alan-vo"
    assert data["version"] == "1.0.0"


@pytest.mark.asyncio
async def test_jwks_endpoint(client):
    response = await client.get("/.well-known/jwks.json")
    assert response.status_code == 200
    data = response.json()
    assert "keys" in data
    assert len(data["keys"]) > 0
    assert data["keys"][0]["kty"] == "RSA"
    assert data["keys"][0]["alg"] == "RS256"