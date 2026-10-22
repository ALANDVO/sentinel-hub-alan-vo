from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional, Tuple
from backend.app.models import Skill, SkillLevel, SkillOverride, SkillVisibility


class SkillService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_skill(
        self,
        name: str,
        level: SkillLevel,
        description: Optional[str] = None,
        namespace: Optional[str] = None,
        content: Optional[str] = None,
        version: Optional[str] = None,
    ) -> Skill:
        skill = Skill(
            name=name,
            level=level,
            description=description,
            namespace=namespace,
            content=content,
            version=version,
        )
        self.db.add(skill)
        await self.db.commit()
        await self.db.refresh(skill)
        return skill
    
    async def get_skill(self, skill_id: int) -> Optional[Skill]:
        result = await self.db.execute(select(Skill).where(Skill.id == skill_id))
        return result.scalar_one_or_none()
    
    async def list_skills(
        self,
        level: Optional[SkillLevel] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Skill], int]:
        query = select(Skill)
        count_query = select(func.count(Skill.id))
        
        conditions = []
        if level:
            conditions.append(Skill.level == level)
        if search:
            conditions.append(or_(
                Skill.name.ilike(f"%{search}%"),
                Skill.description.ilike(f"%{search}%"),
            ))
        
        if conditions:
            from sqlalchemy import and_
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()
        
        query = query.order_by(Skill.level, Skill.name).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        skills = result.scalars().all()
        
        return list(skills), total
    
    async def update_skill(
        self,
        skill_id: int,
        name: Optional[str] = None,
        level: Optional[SkillLevel] = None,
        description: Optional[str] = None,
        namespace: Optional[str] = None,
        content: Optional[str] = None,
        version: Optional[str] = None,
    ) -> Optional[Skill]:
        skill = await self.get_skill(skill_id)
        if not skill:
            return None
        
        if name is not None:
            skill.name = name
        if level is not None:
            skill.level = level
        if description is not None:
            skill.description = description
        if namespace is not None:
            skill.namespace = namespace
        if content is not None:
            skill.content = content
        if version is not None:
            skill.version = version
        
        await self.db.commit()
        await self.db.refresh(skill)
        return skill
    
    async def delete_skill(self, skill_id: int) -> bool:
        skill = await self.get_skill(skill_id)
        if not skill:
            return False
        await self.db.delete(skill)
        await self.db.commit()
        return True
    
    def resolve_precedence(self, skills: List[Skill]) -> List[Skill]:
        """Resolve skill precedence: enterprise > personal > project > plugin.
        Plugin skills use namespace to avoid conflicts."""
        level_priority = {
            SkillLevel.ENTERPRISE: 0,
            SkillLevel.PERSONAL: 1,
            SkillLevel.PROJECT: 2,
            SkillLevel.PLUGIN: 3,
        }
        
        seen_names = set()
        result = []
        
        sorted_skills = sorted(skills, key=lambda s: (level_priority[s.level], s.name))
        
        for skill in sorted_skills:
            key = skill.name
            if skill.level == SkillLevel.PLUGIN and skill.namespace:
                key = f"{skill.namespace}:{skill.name}"
            
            if key not in seen_names:
                seen_names.add(key)
                result.append(skill)
        
        return result
    
    async def get_effective_skills(self) -> List[Skill]:
        all_skills, _ = await self.list_skills(page=1, page_size=1000)
        return self.resolve_precedence(all_skills)
    
    async def set_override(self, skill_name: str, visibility: SkillVisibility) -> SkillOverride:
        result = await self.db.execute(
            select(SkillOverride).where(SkillOverride.skill_name == skill_name)
        )
        override = result.scalar_one_or_none()
        
        if override:
            override.visibility = visibility
        else:
            override = SkillOverride(skill_name=skill_name, visibility=visibility)
            self.db.add(override)
        
        await self.db.commit()
        await self.db.refresh(override)
        return override
    
    async def get_override(self, skill_name: str) -> Optional[SkillOverride]:
        result = await self.db.execute(
            select(SkillOverride).where(SkillOverride.skill_name == skill_name)
        )
        return result.scalar_one_or_none()
    
    async def list_overrides(self) -> List[SkillOverride]:
        result = await self.db.execute(select(SkillOverride))
        return list(result.scalars().all())
    
    async def delete_override(self, skill_name: str) -> bool:
        override = await self.get_override(skill_name)
        if not override:
            return False
        await self.db.delete(override)
        await self.db.commit()
        return True
    
    def apply_visibility(self, skills: List[Skill], overrides: List[SkillOverride]) -> List[Skill]:
        override_map = {o.skill_name: o.visibility for o in overrides}
        visible_skills = []
        
        for skill in skills:
            visibility = override_map.get(skill.name, SkillVisibility.ON)
            if visibility == SkillVisibility.OFF:
                continue
            visible_skills.append(skill)
        
        return visible_skills