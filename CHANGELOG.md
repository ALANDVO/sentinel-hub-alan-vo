# Changelog

## 1.0.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-22

### Added
- FastAPI backend with async SQLAlchemy and SQLite persistence
- React + TypeScript + Vite frontend with typed API client
- OIDC authentication via Keycloak (authorization-code + PKCE)
- Skill management API with CRUD, pagination, filtering
- Skill precedence resolution engine: Enterprise > Personal > Project > Plugin
- Skill override visibility control (on, name-only, user-invocable-only, off)
- Learning paths with lessons, quizzes, and progress tracking
- MCP server catalog with search, filter, and categories
- Docker Compose with backend, frontend, and Keycloak
- Comprehensive test suites (backend: pytest, frontend: vitest)
- Health checks and readiness probes
- JWKS endpoint for token verification
- Audit logging for auth events

### Security
- HttpOnly SameSite=Lax cookies for sessions
- JWT RS256 tokens with short expiry
- Role-based access control on all data endpoints
- PKCE for OIDC flow
- State and nonce validation
- No hardcoded secrets

### Documentation
- README with architecture diagram, API reference, quick start
- .env.example with all configuration options
- CHANGELOG.md
- LICENSE (MIT)