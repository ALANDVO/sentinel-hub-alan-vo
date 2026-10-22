import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.core.security import token_manager


@pytest.mark.asyncio
async def test_mcp_crud(client):
    token = token_manager.create_access_token(
        subject="test-user",
        roles=["user"],
        email="test@example.com",
    )
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    # Create
    response = await client.post(
        "/mcp",
        json={
            "name": "test-server",
            "description": "Test MCP server",
            "category": "filesystem",
            "repository_url": "https://github.com/test/server",
            "auth_type": "none",
            "realtime": False,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    server = response.json()
    assert server["name"] == "test-server"
    server_id = server["id"]
    
    # Get
    response = await client.get(f"/mcp/{server_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "test-server"
    
    # List
    response = await client.get("/mcp", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    
    # Update
    response = await client.patch(
        f"/mcp/{server_id}",
        json={"description": "Updated description"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["description"] == "Updated description"
    
    # Delete
    response = await client.delete(f"/mcp/{server_id}", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_mcp_filtering(client):
    token = token_manager.create_access_token(
        subject="test-user",
        roles=["user"],
        email="test@example.com",
    )
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    await client.post("/mcp", json={"name": "fs-server", "category": "filesystem", "auth_type": "none"}, headers=auth_headers)
    await client.post("/mcp", json={"name": "db-server", "category": "database", "auth_type": "oauth"}, headers=auth_headers)
    await client.post("/mcp", json={"name": "git-server", "category": "repository", "auth_type": "token"}, headers=auth_headers)
    
    # Filter by category
    response = await client.get("/mcp?category=filesystem", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert all(s["category"] == "filesystem" for s in data["items"])
    
    # Search
    response = await client.get("/mcp?search=server", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert all("server" in s["name"].lower() for s in data["items"])
    
    # Categories list
    response = await client.get("/mcp/categories", headers=auth_headers)
    assert response.status_code == 200
    categories = response.json()
    assert "filesystem" in categories
    assert "database" in categories
    assert "repository" in categories


@pytest.mark.asyncio
async def test_mcp_pagination(client):
    token = token_manager.create_access_token(
        subject="test-user",
        roles=["user"],
        email="test@example.com",
    )
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    for i in range(5):
        await client.post("/mcp", json={"name": f"server-{i}", "category": "test"}, headers=auth_headers)
    
    response = await client.get("/mcp?page=1&page_size=3", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 3
    assert data["page"] == 1
    assert data["page_size"] == 3
    assert data["total"] >= 5


@pytest.mark.asyncio
async def test_unauthenticated_rejected(client):
    response = await client.get("/mcp")
    assert response.status_code == 401