from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.request import Request
from app.schemas.request import RequestCreate, RequestUpdate
from datetime import timedelta, datetime

class CRUDRequest(CRUDBase[Request, RequestCreate, RequestUpdate]):
    def create(
        self, db: Session, *, obj_in: RequestCreate, created_by: int
    ) -> Request:
        data = obj_in.model_dump(exclude={"is_guest"})
        db_obj = Request(
            **data,
            created_by=created_by
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    
    def get_by_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Request]:
        return (
            db.query(self.model)
            .filter(Request.created_by == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_assigned_to_user(
        self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Request]:
        return (
            db.query(self.model)
            .filter(Request.assigned_to == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_status(
        self, db: Session, *, status: str, skip: int = 0, limit: int = 100
    ) -> List[Request]:
        return (
            db.query(self.model)
            .filter(Request.status == status)
            .offset(skip)
            .limit(limit)
            .all()
        )
    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        filters: Dict[str, Any] = None,
        order_by: Optional[str] = "-updated_at, -created_at",
    ) -> Dict[str, Any]:
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


        # This is powerful search to give the frontend the ability to sort by multiple columns in a single request ( e.g. "-created_at, -updated_at" ) 
        # { THEY WILL HAVE FUN WITH THIS :) }
        order_by = order_by.split(", ")
        for order in order_by:
            if order[0] == "-":
                query = query.order_by(getattr(self.model, order[1:]).desc())
            elif order[0] == "+":
                query = query.order_by(getattr(self.model, order[1:]).asc())
        
        total = query.count()
        results = query.offset(skip).limit(limit).all()
        
        return {
            "remaining": max(0, total - (skip + limit)),
            "results": results
        }
    

crud_request = CRUDRequest(Request)