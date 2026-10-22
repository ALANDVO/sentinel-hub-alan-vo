from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from backend.app.core.config import settings
from backend.app.api import health, auth, skills, learning, mcp
from backend.app.api.deps import init_db
from backend.app.core.security import token_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="sentinel-hub-alan-vo",
    description="A visual, example-driven guide to Claude Code",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.jwt_secret_key,
    max_age=3600,
    same_site="lax",
    https_only=settings.environment == "production",
)


@app.get("/.well-known/jwks.json")
async def jwks():
    public_key = token_manager.get_public_key_pem()
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    
    public_key_obj = serialization.load_pem_public_key(public_key.encode())
    if isinstance(public_key_obj, rsa.RSAPublicKey):
        numbers = public_key_obj.public_numbers()
        import base64
        n = base64.urlsafe_b64encode(numbers.n.to_bytes((numbers.n.bit_length() + 7) // 8, "big")).decode().rstrip("=")
        e = base64.urlsafe_b64encode(numbers.e.to_bytes((numbers.e.bit_length() + 7) // 8, "big")).decode().rstrip("=")
        return {
            "keys": [{
                "kty": "RSA",
                "use": "sig",
                "alg": "RS256",
                "n": n,
                "e": e,
                "kid": "sentinel-hub-key-1",
            }]
        }
    return {"keys": []}


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(skills.router)
app.include_router(learning.router)
app.include_router(mcp.router)


@app.get("/")
async def root():
    return {
        "name": "sentinel-hub-alan-vo",
        "version": "1.0.0",
        "description": "A visual, example-driven guide to Claude Code",
    }