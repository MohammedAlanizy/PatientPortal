from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.crud.base import CRUDBase
from app.models.assignee import Assignee
from app.schemas.assignee import AssigneeCreate, AssigneeUpdate
from app.core.config import settings

class CRUDAssignee(CRUDBase[Assignee, AssigneeCreate, AssigneeUpdate]):
    async def get_by_name(self, db: AsyncSession, *, full_name: str) -> Optional[Assignee]:
        query = select(Assignee).filter(Assignee.full_name == full_name)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_active_assignees(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[Assignee]:
        # To double check the limit is not too high, and reset it if it is
        if limit > settings.MAX_FETCH_LIMIT:
            limit = settings.MAX_FETCH_LIMIT
        query = select(Assignee).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()
    
    async def create_with_validation(
        self, db: AsyncSession, *, obj_in: AssigneeCreate
    ) -> Assignee:
        existing_assignee = await self.get_by_name(db, full_name=obj_in.full_name)
        if existing_assignee:
            raise ValueError("An assignee with this name already exists")
        
        db_obj = Assignee(
            full_name=obj_in.full_name
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
    
    async def get_assignees_by_ids(
        self, db: AsyncSession, *, ids: List[int]
    ) -> List[Assignee]:
        query = select(Assignee).filter(Assignee.id.in_(ids))
        result = await db.execute(query)
        return result.scalars().all()
    
    async def search_assignees(
        self, db: AsyncSession, *, query_str: str, skip: int = 0, limit: int = 100
    ) -> List[Assignee]:
        # To double check the limit is not too high, and reset it if it is
        if limit > settings.MAX_FETCH_LIMIT:
            limit = settings.MAX_FETCH_LIMIT
        query = select(Assignee).filter(
            Assignee.full_name.ilike(f"%{query_str}%")
        ).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

crud_assignee = CRUDAssignee(Assignee)