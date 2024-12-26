from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from api.deps import get_db, get_current_user, require_roles
from crud.crud_assignee import crud_assignee
from schemas.assignee import AssigneeCreate, AssigneeUpdate, AssigneeResponse, AssigneeListResponse, AssigneeStats, AssigneeStatsResponse
from models.user import User
from models.assignee import Assignee
from models.request import Request
from schemas.request import Status
from core.roles import Role

router = APIRouter()

@router.get("/stats", response_model=AssigneeStatsResponse)
def get_assignee_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN, Role.VERIFIER]))
):

    assignees = db.query(Assignee).all()
    
    stats = []
    for assignee in assignees:
        # Base query for this assignee
        base_query = db.query(Request).filter(Request.assigned_to == assignee.id)
        
        # Get counts using separate filtered queries
        completed = base_query.filter(Request.status == Status.COMPLETED).count()
        
        stats.append(AssigneeStats(
            full_name=assignee.full_name,
            completed=completed,
        ))

    return {"stats": stats}


@router.post("/", response_model=AssigneeResponse)
def create_assignee(
    assignee: AssigneeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN]))
):
    return crud_assignee.create(db=db, obj_in=assignee)

@router.get("/", response_model=AssigneeListResponse)
def read_assignees(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN, Role.VERIFIER]))
):
    assignees = crud_assignee.get_multi(db, skip=skip, limit=limit)
    return assignees

@router.get("/{assignee_id}", response_model=AssigneeResponse)
def read_assignee(
    assignee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN]))
):
    assignee = crud_assignee.get(db=db, id=assignee_id)
    if not assignee:
        raise HTTPException(
            status_code=404,
            detail="Assignee not found"
        )
    return assignee

@router.put("/{assignee_id}", response_model=AssigneeResponse)
def update_assignee(
    assignee_id: int,
    assignee_in: AssigneeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN]))
):
    
    assignee = crud_assignee.get(db=db, id=assignee_id)
    if not assignee:
        raise HTTPException(
            status_code=404,
            detail="Assignee not found"
        )
    assignee = crud_assignee.update(db=db, db_obj=assignee, obj_in=assignee_in)
    return assignee

@router.delete("/{assignee_id}", response_model=AssigneeResponse)
def delete_assignee(
    assignee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN]))
):  
    assignee = crud_assignee.get(db=db, id=assignee_id)
    if not assignee:
        raise HTTPException(
            status_code=404,
            detail="Assignee not found"
        )
    assignee = crud_assignee.remove(db=db, id=assignee_id)
    return assignee
