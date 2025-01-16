from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from app.db.base_class import Base
from sqlalchemy import func
from datetime import timedelta, datetime, timezone
from app.core.config import settings

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get(self, db: AsyncSession, id: Any) -> Optional[ModelType]:
        query = select(self.model).filter(self.model.id == id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_multi(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        query = select(self.model)

        # To double check the limit is not too high, and reset it if it is
        if limit > settings.MAX_FETCH_LIMIT:
            limit = settings.MAX_FETCH_LIMIT

        if filters:
            for attr, value in filters.items():
                if attr == 'start_date':
                    if isinstance(value, str):
                        start_date = datetime.strptime(value, "%Y-%m-%d")
                    elif isinstance(value, datetime):
                        start_date = value
                    else:
                        raise ValueError("start_date must be a string or datetime object.")

                    # Ensure it's timezone-aware
                    if start_date.tzinfo is None:
                        start_date = start_date.replace(tzinfo=timezone.utc)

                    query = query.filter(self.model.created_at >= start_date)

                elif attr == 'end_date':
                    if isinstance(value, str):
                        end_date = datetime.strptime(value, "%Y-%m-%d")
                    elif isinstance(value, datetime):
                        end_date = value
                    else:
                        raise ValueError("end_date must be a string or datetime object.")
                    
                    # Ensure it's timezone-aware
                    if end_date.tzinfo is None:
                        end_date = end_date.replace(tzinfo=timezone.utc)

                    query = query.filter(self.model.created_at <= end_date)

                else:
                    query = query.filter(getattr(self.model, attr) == value)

        # Get total count
        count_result = await db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar()

        # Get paginated results
        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        items = result.scalars().all()

        return {
            "remaining": max(0, total - (skip + limit)),
            "results": items
        }


    async def create(self, db: AsyncSession, *, obj_in: CreateSchemaType) -> ModelType:
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def remove(self, db: AsyncSession, *, id: int) -> ModelType:
        obj = await db.get(self.model, id)
        await db.delete(obj)
        await db.commit()
        return obj