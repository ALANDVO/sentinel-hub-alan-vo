from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from backend.app.models import Skill, SkillLevel, SkillOverride, SkillVisibility
from backend.app.services.skill_service import SkillService
from backend.app.api.deps import get_db, get_current_user
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


router = APIRouter(prefix="/skills", tags=["skills"])


class SkillCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    level: SkillLevel
    description: Optional[str] = None
    namespace: Optional[str] = None
    content: Optional[str] = None
    version: Optional[str] = None


class SkillUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    level: Optional[SkillLevel] = None
    description: Optional[str] = None
    namespace: Optional[str] = None
    content: Optional[str] = None
    version: Optional[str] = None


class SkillResponse(BaseModel):
    id: int
    name: str
    level: SkillLevel
    description: Optional[str]
    namespace: Optional[str]
    content: Optional[str]
    version: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SkillListResponse(BaseModel):
    items: List[SkillResponse]
    total: int
    page: int
    page_size: int


class SkillOverrideCreate(BaseModel):
    skill_name: str = Field(..., min_length=1, max_length=255)
    visibility: SkillVisibility = SkillVisibility.ON


class SkillOverrideResponse(BaseModel):
    id: int
    skill_name: str
    visibility: SkillVisibility
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


@router.post("", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def create_skill(
    skill_data: SkillCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = SkillService(db)
    skill = await service.create_skill(**skill_data.model_dump())
    return skill


@router.get("", response_model=SkillListResponse)
async def list_skills(
    level: Optional[SkillLevel] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = SkillService(db)
    skills, total = await service.list_skills(level=level, search=search, page=page, page_size=page_size)
    return SkillListResponse(
        items=skills,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/effective", response_model=List[SkillResponse])
async def get_effective_skills(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = SkillService(db)
    skills = await service.get_effective_skills()
    overrides = await service.list_overrides()
    visible_skills = service.apply_visibility(skills, overrides)
    return visible_skills


@router.get("/{skill_id}", response_model=SkillResponse)
async def get_skill(
    skill_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = SkillService(db)
    skill = await service.get_skill(skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill


@router.patch("/{skill_id}", response_model=SkillResponse)
async def update_skill(
    skill_id: int,
    skill_data: SkillUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = SkillService(db)
    skill = await service.update_skill(skill_id, **skill_data.model_dump(exclude_unset=True))
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(
    skill_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = SkillService(db)
    success = await service.delete_skill(skill_id)
    if not success:
        raise HTTPException(status_code=404, detail="Skill not found")


@router.post("/overrides", response_model=SkillOverrideResponse, status_code=status.HTTP_201_CREATED)
async def create_override(
    override_data: SkillOverrideCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = SkillService(db)
    override = await service.set_override(override_data.skill_name, override_data.visibility)
    return override


@router.get("/overrides", response_model=List[SkillOverrideResponse])
async def list_overrides(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = SkillService(db)
    return await service.list_overrides()


@router.get("/overrides/{skill_name}", response_model=SkillOverrideResponse)
async def get_override(
    skill_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = SkillService(db)
    override = await service.get_override(skill_name)
    if not override:
        raise HTTPException(status_code=404, detail="Override not found")
    return override


@router.delete("/overrides/{skill_name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_override(
    skill_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    service = SkillService(db)
    success = await service.delete_override(skill_name)
    if not success:
        raise HTTPException(status_code=404, detail="Override not found")