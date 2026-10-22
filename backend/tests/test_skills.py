import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.core.security import token_manager


@pytest.mark.asyncio
async def test_skills_crud(client):
    token = token_manager.create_access_token(
        subject="test-user",
        roles=["user"],
        email="test@example.com",
    )
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    # Create skill
    response = await client.post(
        "/skills",
        json={
            "name": "test-skill",
            "level": "personal",
            "description": "A test skill",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    skill = response.json()
    assert skill["name"] == "test-skill"
    assert skill["level"] == "personal"
    skill_id = skill["id"]
    
    # Get skill
    response = await client.get(f"/skills/{skill_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "test-skill"
    
    # List skills
    response = await client.get("/skills", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any(s["name"] == "test-skill" for s in data["items"])
    
    # Update skill
    response = await client.patch(
        f"/skills/{skill_id}",
        json={"description": "Updated description"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["description"] == "Updated description"
    
    # Delete skill
    response = await client.delete(f"/skills/{skill_id}", headers=auth_headers)
    assert response.status_code == 204
    
    # Verify deleted
    response = await client.get(f"/skills/{skill_id}", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_skill_precedence(client):
    token = token_manager.create_access_token(
        subject="test-user",
        roles=["user"],
        email="test@example.com",
    )
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    service_data = [
        {"name": "deploy", "level": "enterprise", "description": "Enterprise deploy"},
        {"name": "deploy", "level": "personal", "description": "Personal deploy"},
        {"name": "deploy", "level": "project", "description": "Project deploy"},
    ]
    
    created_ids = []
    for skill_data in service_data:
        response = await client.post("/skills", json=skill_data, headers=auth_headers)
        assert response.status_code == 201
        created_ids.append(response.json()["id"])
    
    # Get effective skills - should only have one "deploy" (enterprise wins)
    response = await client.get("/skills/effective", headers=auth_headers)
    assert response.status_code == 200
    effective = response.json()
    
    deploy_skills = [s for s in effective if s["name"] == "deploy"]
    assert len(deploy_skills) == 1
    assert deploy_skills[0]["level"] == "enterprise"
    
    # Cleanup
    for skill_id in created_ids:
        await client.delete(f"/skills/{skill_id}", headers=auth_headers)


@pytest.mark.asyncio
async def test_skill_overrides(client):
    token = token_manager.create_access_token(
        subject="test-user",
        roles=["user"],
        email="test@example.com",
    )
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    # Create a skill
    response = await client.post(
        "/skills",
        json={"name": "my-skill", "level": "personal", "description": "Test"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    
    # Set override to hide it
    response = await client.post(
        "/skills/overrides",
        json={"skill_name": "my-skill", "visibility": "off"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    override = response.json()
    assert override["skill_name"] == "my-skill"
    assert override["visibility"] == "off"
    
    # Get effective - should not include hidden skill
    response = await client.get("/skills/effective", headers=auth_headers)
    assert response.status_code == 200
    effective = response.json()
    assert not any(s["name"] == "my-skill" for s in effective)
    
    # Change visibility to name-only
    response = await client.post(
        "/skills/overrides",
        json={"skill_name": "my-skill", "visibility": "name-only"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    
    # Get override
    response = await client.get("/skills/overrides/my-skill", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["visibility"] == "name-only"
    
    # Delete override
    response = await client.delete("/skills/overrides/my-skill", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_skill_filtering(client):
    token = token_manager.create_access_token(
        subject="test-user",
        roles=["user"],
        email="test@example.com",
    )
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    await client.post("/skills", json={"name": "skill-a", "level": "personal"}, headers=auth_headers)
    await client.post("/skills", json={"name": "skill-b", "level": "project"}, headers=auth_headers)
    await client.post("/skills", json={"name": "other", "level": "enterprise"}, headers=auth_headers)
    
    # Filter by level
    response = await client.get("/skills?level=personal", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert all(s["level"] == "personal" for s in data["items"])
    
    # Search
    response = await client.get("/skills?search=skill", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert all("skill" in s["name"].lower() for s in data["items"])
    
    # Pagination
    response = await client.get("/skills?page=1&page_size=2", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) <= 2
    assert data["page"] == 1
    assert data["page_size"] == 2


@pytest.mark.asyncio
async def test_unauthenticated_rejected(client):
    response = await client.get("/skills")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_invalid_token_rejected(client):
    response = await client.get("/skills", headers={"Authorization": "Bearer invalid-token"})
    assert response.status_code == 401