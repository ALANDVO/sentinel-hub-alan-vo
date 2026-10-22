from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from backend.app.core.security import token_manager, generate_pkce_pair, create_state_nonce, build_authorization_url
from backend.app.core.config import settings
from backend.app.api.deps import get_db
from backend.app.models import AuditLog
from datetime import datetime, timezone
import httpx
import secrets


router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/login")
async def login(request: Request):
    verifier, challenge = generate_pkce_pair()
    state, nonce = create_state_nonce()
    
    request.session["pkce_verifier"] = verifier
    request.session["oauth_state"] = state
    request.session["oauth_nonce"] = nonce
    
    auth_url = build_authorization_url(
        redirect_uri=settings.oidc_redirect_uri,
        state=state,
        nonce=nonce,
        code_challenge=challenge,
    )
    
    return {"authorization_url": auth_url, "state": state}


@router.get("/callback")
async def callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    if error:
        raise HTTPException(status_code=400, detail=f"OAuth error: {error} - {error_description}")
    
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")
    
    stored_state = request.session.get("oauth_state")
    stored_nonce = request.session.get("oauth_nonce")
    verifier = request.session.get("pkce_verifier")
    
    if not stored_state or state != stored_state:
        raise HTTPException(status_code=400, detail="Invalid state")
    
    if not verifier:
        raise HTTPException(status_code=400, detail="Missing PKCE verifier")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        token_response = await client.post(
            f"{settings.oidc_issuer_url}/protocol/openid-connect/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.oidc_client_id,
                "client_secret": settings.oidc_client_secret,
                "code": code,
                "redirect_uri": settings.oidc_redirect_uri,
                "code_verifier": verifier,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    
    if token_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Token exchange failed")
    
    token_data = token_response.json()
    access_token = token_data.get("access_token")
    id_token = token_data.get("id_token")
    
    if not access_token or not id_token:
        raise HTTPException(status_code=400, detail="Missing tokens in response")
    
    try:
        claims = token_manager.decode_token(access_token)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid access token: {str(e)}")
    
    user_id = claims.get("sub")
    email = claims.get("email")
    roles = claims.get("roles", [])
    
    if not user_id or not email:
        raise HTTPException(status_code=400, detail="Invalid token claims")
    
    internal_token = token_manager.create_access_token(
        subject=user_id,
        roles=roles,
        email=email,
    )
    
    audit_log = AuditLog(
        user_id=user_id,
        action="login",
        resource_type="auth",
        details={"method": "oidc"},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(audit_log)
    await db.commit()
    
    request.session.clear()
    request.session["user_id"] = user_id
    request.session["access_token"] = internal_token
    request.session["roles"] = roles
    request.session["email"] = email
    
    return {
        "access_token": internal_token,
        "token_type": "bearer",
        "user": {"id": user_id, "email": email, "roles": roles},
    }


@router.post("/logout")
async def logout(request: Request, response: Response):
    user_id = request.session.get("user_id")
    
    if user_id:
        async with get_db() as db:
            audit_log = AuditLog(
                user_id=user_id,
                action="logout",
                resource_type="auth",
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
            db.add(audit_log)
            await db.commit()
    
    request.session.clear()
    response.delete_cookie("session", httponly=True, secure=True, samesite="lax")
    
    return {"message": "Logged out successfully"}


@router.get("/me")
async def me(request: Request):
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {
        "id": user_id,
        "email": request.session.get("email"),
        "roles": request.session.get("roles", []),
    }