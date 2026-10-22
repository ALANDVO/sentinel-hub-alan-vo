from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
import secrets


class Settings(BaseSettings):
    app_name: str = "sentinel-hub-alan-vo"
    debug: bool = False
    environment: str = "development"
    
    database_url: str = "sqlite+aiosqlite:///./sentinel.db"
    
    oidc_issuer_url: str = "http://localhost:8080/realms/sentinel-hub"
    oidc_client_id: str = "sentinel-hub"
    oidc_client_secret: str = "change-me"
    oidc_redirect_uri: str = "http://localhost:3000/callback"
    oidc_scopes: str = "openid profile email roles"
    
    jwt_secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    jwt_algorithm: str = "RS256"
    jwt_audience: str = "sentinel-hub-api"
    
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    llm_base_url: Optional[str] = None
    llm_api_key: Optional[str] = None
    
    cors_origins: list[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()