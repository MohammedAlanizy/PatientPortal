from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from crud.base import CRUDBase
from models.request import Request
from schemas.request import RequestCreate, RequestUpdate

class CRUDRequest(CRUDBase[Request, RequestCreate, RequestUpdate]):
    def create(
        self, db: Session, *, obj_in: RequestCreate, created_by: int
    ) -> Request:
        db_obj = Request(
            **obj_in.dict(),
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
        join_relationships: List[str] = None
    ) -> Dict[str, Any]:
        query = db.query(self.model)
        if filters:
            if 'status' in filters:
                query = query.filter(Request.status == filters['status'])
            if 'start_date' in filters:
                query = query.filter(Request.created_at >= filters['start_date'])
            if 'end_date' in filters:
                query = query.filter(Request.created_at <= filters['end_date'])

        # Order by created_at in descending order (newest first)
        query = query.order_by(Request.updated_at.desc())
        query = query.order_by(Request.created_at.desc())
        total = query.count()
        results = query.offset(skip).limit(limit).all()
        
        return {
            "remaining": max(0, total - (skip + limit)),
            "results": results
        }
    

crud_request = CRUDRequest(Request)