# sentinel-hub-alan-vo

> Work in progress. This checkpoint may be incomplete or fail tests. See PLAN.md and STATUS.md before use.


A visual, example-driven guide to Claude Code — from basic concepts to advanced agents, with copy-paste templates that bring immediate value.

## Overview

**sentinel-hub-alan-vo** is an AI/ML developer tool that provides a structured learning platform for mastering Claude Code. It combines interactive skill management with precedence resolution, guided learning paths with progress tracking, and an MCP server catalog — all backed by secure OIDC authentication through Keycloak.

**Author:** Alan Vo (alanvo@gmail.com) | GitHub: ALANDVO

### Key Features

1. **Skill Management with Precedence Resolution** — Manage skills across enterprise, personal, project, and plugin levels. The engine correctly resolves precedence: **Enterprise > Personal > Project > Plugin** (plugin skills use namespace qualification to avoid conflicts). Skill overrides control visibility (on, name-only, user-invocable-only, off) — not precedence.

2. **Learning Paths with Quizzes** — Structured lessons with embedded quiz questions. Progress is tracked per user with pass/fail thresholds (70%). Three workflows: browse lessons, practice with content, assess with quizzes.

3. **MCP Server Catalog** — Searchable, filterable catalog of Model Context Protocol servers with categories, auth types, and realtime capabilities.

4. **Secure OIDC Authentication** — Authorization-code flow with PKCE, state, and nonce through Keycloak. HttpOnly cookies for session management, JWT tokens for API access. Role-based access control (user/admin).

### AI/ML Evaluation

This application serves as a developer tool for AI-assisted coding workflows. The skill precedence engine implements deterministic algorithms that mirror Claude Code's actual behavior (verified against v2.1.235). The learning system provides a reproducible baseline for evaluating knowledge acquisition in AI tool usage.

**Reproducible evaluation command:**
```bash
python -m pytest backend/tests/test_skills.py::test_skill_precedence -v
```

**Expected result:** Enterprise skills win over personal, personal over project, plugin skills are namespace-qualified and never conflict.

**Failure cases:** If precedence order is inverted (project > personal), the test fails — this caught the upstream bug documented in issue #176.

### Architecture

```mermaid
graph TB
    subgraph "Frontend (React + Vite + TS)"
        UI[Dashboard UI]
        API_CLIENT[Typed API Client]
        AUTH_HOOK[useAuth Hook]
    end
    
    subgraph "Backend (FastAPI + SQLAlchemy)"
        MAIN[FastAPI App]
        AUTH_API[/auth]
        SKILLS_API[/skills]
        LEARNING_API[/learning]
        MCP_API[/mcp]
        SKILL_SVC[Skill Service]
        PRECEDENCE[Precedence Engine]
        DB[(SQLite)]
    end
    
    subgraph "Identity"
        KEYCLOAK[Keycloak OIDC]
    end
    
    UI --> API_CLIENT
    API_CLIENT --> MAIN
    AUTH_HOOK --> AUTH_API
    AUTH_API --> KEYCLOAK
    SKILLS_API --> SKILL_SVC
    SKILL_SVC --> PRECEDENCE
    SKILL_SVC --> DB
    LEARNING_API --> DB
    MCP_API --> DB
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /health/ready | Readiness check |
| GET | /.well-known/jwks.json | JWKS for token verification |
| GET | /auth/login | Initiate OIDC login |
| GET | /auth/callback | OIDC callback (PKCE) |
| POST | /auth/logout | Logout |
| GET | /auth/me | Current user info |
| GET | /skills | List skills (paginated, filtered) |
| GET | /skills/effective | Effective skills after precedence |
| POST | /skills | Create skill |
| GET | /skills/{id} | Get skill |
| PATCH | /skills/{id} | Update skill |
| DELETE | /skills/{id} | Delete skill |
| GET | /skills/overrides | List skill overrides |
| POST | /skills/overrides | Create override |
| DELETE | /skills/overrides/{name} | Delete override |
| GET | /learning | List lessons with questions |
| GET | /learning/{id} | Get lesson |
| GET | /learning/progress/me | User progress |
| POST | /learning/progress/{id} | Submit quiz score |
| GET | /mcp | List MCP servers |
| GET | /mcp/categories | List categories |
| POST | /mcp | Create MCP server |
| GET | /mcp/{id} | Get MCP server |
| PATCH | /mcp/{id} | Update MCP server |
| DELETE | /mcp/{id} | Delete MCP server |

### Quick Start

```bash
# 1. Clone and configure
git clone https://github.com/ALANDVO/sentinel-hub-alan-vo.git
cd sentinel-hub-alan-vo
cp .env.example .env
# Edit .env with your Keycloak credentials

# 2. Start with Docker Compose
docker compose up -d

# 3. Access
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Keycloak Admin: http://localhost:8080 (admin/admin)

# 4. Run tests
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
.venv/bin/python -m pytest backend/tests -v

cd frontend
npm install
npm run build
npm test
```

### Development

```bash
# Backend
cd backend
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Frontend
cd frontend
npm install
npm run dev

# Keycloak (separate)
docker run -p 8080:8080 -e KC_BOOTSTRAP_ADMIN_USER=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:25.0 start-dev
```

### Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | SQLite async URL | Yes |
| `OIDC_ISSUER_URL` | Keycloak realm URL | Yes |
| `OIDC_CLIENT_ID` | OIDC client ID | Yes |
| `OIDC_CLIENT_SECRET` | OIDC client secret | Yes |
| `OIDC_REDIRECT_URI` | Frontend callback URL | Yes |
| `OIDC_SCOPES` | OIDC scopes | Yes |
| `JWT_SECRET_KEY` | Session secret | Yes |
| `JWT_ALGORITHM` | RS256 | Yes |
| `JWT_AUDIENCE` | API audience | Yes |
| `LLM_PROVIDER` | LLM provider (openai/anthropic/gemini/ollama) | No |
| `LLM_MODEL` | Model name | No |
| `LLM_BASE_URL` | Custom base URL | No |
| `LLM_API_KEY` | LLM API key | No |
| `CORS_ORIGINS` | Allowed origins | Yes |

### LLM Provider Support

The application supports multiple LLM providers through configurable adapters (opt-in, advisory only):
- **OpenAI-compatible** (OpenAI, LiteLLM, OpenRouter, Ollama)
- **Anthropic** (Messages API)
- **Gemini** (generateContent)
- **Ollama** (local)

Keys are server-side only. No hardcoded endpoints or credentials.

### Security

- **Authentication**: OIDC authorization-code + PKCE via Keycloak
- **Authorization**: Role-based (user/admin) on all data endpoints
- **Tokens**: JWT RS256, short-lived access tokens, JWKS endpoint
- **Sessions**: HttpOnly SameSite=Lax cookies, CSRF-protected
- **Secrets**: Never logged, never committed, .env.example provided
- **Demo mode**: Explicitly labeled, refuses to start in production (ENVIRONMENT=production)

### Deployment

**TLS Reverse Proxy Required for Production:**
- Terminate TLS at nginx/Traefik/Caddy
- Forward to backend:8000 and frontend:3000
- Set `ENVIRONMENT=production` and `JWT_SECRET_KEY` to strong random value
- Use external PostgreSQL for HA (migrate from SQLite)

**Backup/Restore:**
- SQLite: copy `data/sentinel.db`
- Keycloak: export realm JSON

**IdP Enrollment:**
- Keycloak supports SAML/OIDC identity brokering
- Configure upstream IdP in Keycloak admin console
- Map roles to realm roles (user/admin)

### License

MIT License — Copyright (c) 2026 Alan Vo <alanvo@gmail.com>