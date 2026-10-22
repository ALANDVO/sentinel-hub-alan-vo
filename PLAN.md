# Product development plan

Each round completes one feature or repair. Future items are planned, not implemented claims.

## Current round

skeleton

## Roadmap

### skeleton — FastAPI + React skeleton with OIDC auth

Status: done

Acceptance:
- Backend FastAPI app runs with /health endpoint
- Frontend React + Vite + TypeScript builds
- Docker compose with backend, frontend, Keycloak
- OIDC authorization-code flow with PKCE

Implementation: `backend/app/main.py`, `backend/app/api/health.py`, `backend/app/api/auth.py`, `backend/app/api/deps.py`, `backend/app/core/config.py`, `backend/app/core/security.py`, `backend/requirements.txt`, `frontend/package.json`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/api/client.ts`, `docker-compose.yaml`, `Dockerfile.backend`, `Dockerfile.frontend`

Tests: `backend/tests/test_health.py`, `backend/tests/test_skills.py`, `backend/tests/test_learning.py`, `backend/tests/test_mcp.py`, `frontend/src/components/SkillsPage.test.tsx`, `frontend/src/components/LearningPage.test.tsx`, `frontend/src/components/MCPPage.test.tsx`

### skill-guide-engine — Skill guide domain engine with precedence resolution

Status: done

Acceptance:
- Skill model with enterprise/personal/project/plugin levels
- Precedence resolution: enterprise > personal > project
- skillOverrides visibility control (object keyed by skill name)
- API CRUD for skills with pagination/filtering

Implementation: `backend/app/models/__init__.py`, `backend/app/services/skill_service.py`, `backend/app/api/skills.py`, `frontend/src/hooks/useSkills.tsx`, `frontend/src/components/SkillsPage.tsx`, `frontend/src/components/SkillFormModal.tsx`, `frontend/src/components/OverrideFormModal.tsx`

Tests: `backend/tests/test_skills.py`, `frontend/src/components/SkillsPage.test.tsx`

### learning-paths — Learning paths with progress tracking

Status: done

Acceptance:
- Lesson/quiz data model
- Progress persistence per user
- Three workflows: browse, practice, assess

Implementation: `backend/app/models/__init__.py`, `backend/app/api/learning.py`, `frontend/src/hooks/useLearning.tsx`, `frontend/src/components/LearningPage.tsx`

Tests: `backend/tests/test_learning.py`, `frontend/src/components/LearningPage.test.tsx`

### mcp-catalog — MCP server catalog with search

Status: done

Acceptance:
- MCP server model with categories
- Search/filter API
- Frontend catalog UI

Implementation: `backend/app/models/__init__.py`, `backend/app/api/mcp.py`, `frontend/src/hooks/useMCP.tsx`, `frontend/src/components/MCPPage.tsx`, `frontend/src/components/MCPFormModal.tsx`

Tests: `backend/tests/test_mcp.py`, `frontend/src/components/MCPPage.test.tsx`

