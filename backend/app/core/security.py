from typing import Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import secrets
import hashlib
import base64
from jose import jwt, JWTError
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from backend.app.core.config import settings


def generate_pkce_pair() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(32)
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()
    ).decode().rstrip("=")
    return verifier, challenge


def create_state_nonce() -> tuple[str, str]:
    state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    return state, nonce


def build_authorization_url(
    redirect_uri: str,
    state: str,
    nonce: str,
    code_challenge: str,
    scopes: str = "openid profile email roles"
) -> str:
    from urllib.parse import urlencode
    params = {
        "client_id": settings.oidc_client_id,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "scope": scopes,
        "state": state,
        "nonce": nonce,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }
    return f"{settings.oidc_issuer_url}/protocol/openid-connect/auth?{urlencode(params)}"


class TokenManager:
    def __init__(self):
        self._jwks_cache: Optional[Dict[str, Any]] = None
        self._jwks_fetched_at: Optional[datetime] = None
        self._private_key: Optional[rsa.RSAPrivateKey] = None
        self._public_key: Optional[rsa.RSAPublicKey] = None
        self._generate_keys()
    
    def _generate_keys(self):
        self._private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        self._public_key = self._private_key.public_key()
    
    def get_public_key_pem(self) -> str:
        return self._public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode()
    
    def create_access_token(
        self,
        subject: str,
        roles: list[str],
        email: str,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
        to_encode = {
            "sub": subject,
            "roles": roles,
            "email": email,
            "aud": settings.jwt_audience,
            "iss": settings.oidc_issuer_url,
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "typ": "Bearer",
        }
        private_pem = self._private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode()
        return jwt.encode(to_encode, private_pem, algorithm="RS256")
    
    def decode_token(self, token: str) -> Dict[str, Any]:
        public_pem = self.get_public_key_pem()
        return jwt.decode(
            token,
            public_pem,
            algorithms=["RS256"],
            audience=settings.jwt_audience,
            issuer=settings.oidc_issuer_url,
        )
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            return self.decode_token(token)
        except JWTError:
            return None


token_manager = TokenManager()