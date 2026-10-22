from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from backend.app.api.deps import get_db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    
    return {
        "status": "ok" if db_status == "healthy" else "degraded",
        "database": db_status,
        "service": "sentinel-hub-alan-vo",
    }


@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"ready": True}
    except Exception:
        return {"ready": False}