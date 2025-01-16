from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.crud.base import CRUDBase
from app.models.request import Request
from app.schemas.request import RequestCreate, RequestUpdate
from datetime import timedelta, datetime
from app.core.config import settings

class CRUDRequest(CRUDBase[Request, RequestCreate, RequestUpdate]):
    async def create(
        self, db: AsyncSession, *, obj_in: RequestCreate, created_by: int
    ) -> Request:
        data = obj_in.model_dump(exclude={"is_guest"})
        db_obj = Request(
            **data,
            created_by=created_by
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_by_user(
        self, db: AsyncSession, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Request]:
        # To double check the limit is not too high, and reset it if it is
        if limit > settings.MAX_FETCH_LIMIT:
            limit = settings.MAX_FETCH_LIMIT
        query = select(self.model).filter(Request.created_by == user_id).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_assigned_to_user(
        self, db: AsyncSession, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Request]:
        # To double check the limit is not too high, and reset it if it is
        if limit > settings.MAX_FETCH_LIMIT:
            limit = settings.MAX_FETCH_LIMIT
        query = select(self.model).filter(Request.assigned_to == user_id).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_by_status(
        self, db: AsyncSession, *, status: str, skip: int = 0, limit: int = 100
    ) -> List[Request]:
        # To double check the limit is not too high, and reset it if it is
        if limit > settings.MAX_FETCH_LIMIT:
            limit = settings.MAX_FETCH_LIMIT
        query = select(self.model).filter(Request.status == status).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_multi(
        self, 
        db: AsyncSession, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        filters: Dict[str, Any] = None,
        order_by: Optional[str] = "-updated_at, -created_at",
    ) -> Dict[str, Any]:
        

        # To double check the limit is not too high, and reset it if it is
        if limit > settings.MAX_FETCH_LIMIT:
            limit = settings.MAX_FETCH_LIMIT
        query = select(self.model)
        
        if filters:
            for attr, value in filters.items():
                if attr == 'start_date':
                    start_date = datetime.strptime(value, "%Y-%m-%d")
                    query = query.filter(self.model.created_at >= start_date)
                elif attr == 'end_date':
                    end_date = datetime.strptime(value, "%Y-%m-%d") 
                    query = query.filter(self.model.created_at <= end_date)
                else:
                    query = query.filter(getattr(self.model, attr) == value)

        # Handling order_by
        order_by = order_by.split(", ")
        for order in order_by:
            if order[0] == "-":
                query = query.order_by(getattr(self.model, order[1:]).desc())
            elif order[0] == "+":
                query = query.order_by(getattr(self.model, order[1:]).asc())
        
        # Get total count
        count_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar()

        # Get paginated results
        result = await db.execute(query.offset(skip).limit(limit))
        items = result.scalars().all()
        
        return {
            "remaining": max(0, total - (skip + limit)),
            "results": items
        }

crud_request = CRUDRequest(Request)