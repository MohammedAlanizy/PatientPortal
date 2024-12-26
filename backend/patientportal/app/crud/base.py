from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db.base_class import Base
from sqlalchemy.orm import joinedload
from datetime import timedelta, datetime

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None,
                   join_relationships: Optional[List[str]] = None) -> ModelType:
        query = db.query(self.model)
        if filters:
            for attr, value in filters.items():
                if attr == 'start_date':
                    start_date = datetime.strptime(value, "%Y-%m-%d")
                    query = query.filter(self.model.created_at >= start_date)
                elif attr == 'end_date':
                    end_date = datetime.strptime(value, "%Y-%m-%d") + timedelta(days=1)
                    query = query.filter(self.model.created_at < end_date)
                else:
                    query = query.filter(getattr(self.model, attr) == value)
        filtered_query = query.offset(skip) 
        results = filtered_query.limit(limit).all()  

        remaining = max(0, query.count() - skip - len(results))  
        return {"remaining": remaining, "results": results}

    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: ModelType, obj_in: Union[UpdateSchemaType, Dict[str, Any]]) -> ModelType:
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: int) -> ModelType:
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj