import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.core.security import token_manager


@pytest.mark.asyncio
async def test_list_lessons(client):
    token = token_manager.create_access_token(
        subject="test-user",
        roles=["user"],
        email="test@example.com",
    )
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    response = await client.get("/learning", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_submit_progress(client):
    token = token_manager.create_access_token(
        subject="test-user",
        roles=["user"],
        email="test@example.com",
    )
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    response = await client.post("/learning/progress/1", json={"score": 85}, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 85
    assert data["completed"] is True
    assert data["lesson_id"] == 1
    
    # Test failing score
    response = await client.post("/learning/progress/2", json={"score": 50}, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 50
    assert data["completed"] is False


@pytest.mark.asyncio
async def test_get_my_progress(client):
    token = token_manager.create_access_token(
        subject="test-user",
        roles=["user"],
        email="test@example.com",
    )
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    # Submit some progress first
    await client.post("/learning/progress/1", json={"score": 90}, headers=auth_headers)
    await client.post("/learning/progress/2", json={"score": 60}, headers=auth_headers)
    
    response = await client.get("/learning/progress/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    
    completed = [p for p in data if p["completed"]]
    assert len(completed) >= 1


@pytest.mark.asyncio
async def test_unauthenticated_rejected(client):
    response = await client.get("/learning")
    assert response.status_code == 401