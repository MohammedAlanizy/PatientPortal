from typing import List, Optional
from sqlalchemy.orm import Session
from crud.base import CRUDBase
from models.assignee import Assignee
from schemas.assignee import AssigneeCreate, AssigneeUpdate

class CRUDAssignee(CRUDBase[Assignee, AssigneeCreate, AssigneeUpdate]):
    def get_by_name(self, db: Session, *, full_name: str) -> Optional[Assignee]:
        return db.query(Assignee).filter(Assignee.full_name == full_name).first()
    
    def get_active_assignees(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[Assignee]:
        # You can add additional filters here if needed
        # For example, if you want to add an 'active' status field later
        return (
            db.query(Assignee)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def create_with_validation(
        self, db: Session, *, obj_in: AssigneeCreate
    ) -> Assignee:
        # Check if assignee with same name exists
        existing_assignee = self.get_by_name(db, full_name=obj_in.full_name)
        if existing_assignee:
            raise ValueError("An assignee with this name already exists")
        
        db_obj = Assignee(
            full_name=obj_in.full_name
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_assignees_by_ids(
        self, db: Session, *, ids: List[int]
    ) -> List[Assignee]:
        return db.query(Assignee).filter(Assignee.id.in_(ids)).all()
    
    def search_assignees(
        self, db: Session, *, query: str, skip: int = 0, limit: int = 100
    ) -> List[Assignee]:
        return (
            db.query(Assignee)
            .filter(Assignee.full_name.ilike(f"%{query}%"))
            .offset(skip)
            .limit(limit)
            .all()
        )

crud_assignee = CRUDAssignee(Assignee)