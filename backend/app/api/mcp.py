from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from backend.app.models import MCPServer
from backend.app.api.deps import get_db, get_current_user
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, func, or_
from datetime import datetime


router = APIRouter(prefix="/mcp", tags=["mcp"])


class MCPServerCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    repository_url: Optional[str] = None
    documentation_url: Optional[str] = None
    auth_type: Optional[str] = None
    realtime: bool = False
    tags: Optional[List[str]] = None


class MCPServerUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    repository_url: Optional[str] = None
    documentation_url: Optional[str] = None
    auth_type: Optional[str] = None
    realtime: Optional[bool] = None
    tags: Optional[List[str]] = None


class MCPServerResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    category: Optional[str]
    repository_url: Optional[str]
    documentation_url: Optional[str]
    auth_type: Optional[str]
    realtime: bool
    tags: Optional[List[str]]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class MCPServerListResponse(BaseModel):
    items: List[MCPServerResponse]
    total: int
    page: int
    page_size: int


@router.post("", response_model=MCPServerResponse, status_code=201)
async def create_mcp_server(
    server_data: MCPServerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    server = MCPServer(**server_data.model_dump())
    db.add(server)
    await db.commit()
    await db.refresh(server)
    return server


@router.get("", response_model=MCPServerListResponse)
async def list_mcp_servers(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = select(MCPServer)
    count_query = select(func.count(MCPServer.id))
    
    conditions = []
    if category:
        conditions.append(MCPServer.category == category)
    if search:
        conditions.append(or_(
            MCPServer.name.ilike(f"%{search}%"),
            MCPServer.description.ilike(f"%{search}%"),
        ))
    
    if conditions:
        from sqlalchemy import and_
        query = query.where(and_(*conditions))
        count_query = count_query.where(and_(*conditions))
    
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()
    
    query = query.order_by(MCPServer.category, MCPServer.name).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    servers = result.scalars().all()
    
    return MCPServerListResponse(
        items=list(servers),
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/categories", response_model=List[str])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(MCPServer.category).distinct())
    categories = [c for c in result.scalars().all() if c]
    return sorted(categories)


@router.get("/{server_id}", response_model=MCPServerResponse)
async def get_mcp_server(
    server_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(MCPServer).where(MCPServer.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="MCP server not found")
    return server


@router.patch("/{server_id}", response_model=MCPServerResponse)
async def update_mcp_server(
    server_id: int,
    server_data: MCPServerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(MCPServer).where(MCPServer.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="MCP server not found")
    
    for field, value in server_data.model_dump(exclude_unset=True).items():
        setattr(server, field, value)
    
    await db.commit()
    await db.refresh(server)
    return server


@router.delete("/{server_id}", status_code=204)
async def delete_mcp_server(
    server_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db.execute(select(MCPServer).where(MCPServer.id == server_id))
    server = result.scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=404, detail="MCP server not found")
    
    await db.delete(server)
    await db.commit()