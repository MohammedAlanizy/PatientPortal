from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user, require_roles
from app.crud.crud_assignee import crud_assignee
from app.schemas.assignee import AssigneeCreate, AssigneeUpdate, AssigneeResponse, AssigneeListResponse, AssigneeStats, AssigneeStatsResponse
from app.models.user import User
from app.models.assignee import Assignee
from app.models.request import Request
from app.schemas.request import Status
from app.core.roles import Role
from sqlalchemy import select, func
from app.core.config import settings

router = APIRouter()

@router.get("/stats", response_model=AssigneeStatsResponse)
async def get_assignee_stats(
    skip: int = 0,
    limit: int = settings.MAX_FETCH_LIMIT,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN, Role.VERIFIER]))
):
    
    if limit > settings.MAX_FETCH_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"Limit must be less than or equal to {settings.MAX_FETCH_LIMIT}"
        )
    
    # Get all assignees (limit to avoid large queries)
    query = select(Assignee).offset(skip).limit(limit)
    result = await db.execute(query)
    assignees = result.scalars().all()
    
    stats = []
    for assignee in assignees:
        # Base query for this assignee's completed requests
        query = select(func.count()).select_from(Request).where(
            Request.assigned_to == assignee.id,
            Request.status == Status.COMPLETED
        )
        result = await db.execute(query)
        completed = result.scalar() or 0
        
        stats.append(AssigneeStats(
            full_name=assignee.full_name,
            completed=completed,
        ))

    return {"stats": stats}

@router.post("/", response_model=AssigneeResponse)
async def create_assignee(
    assignee: AssigneeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN]))
):
    return await crud_assignee.create(db=db, obj_in=assignee)

@router.get("/", response_model=AssigneeListResponse)
async def read_assignees(
    skip: int = 0,
    limit: int = settings.MAX_FETCH_LIMIT,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN, Role.VERIFIER]))
):
    if limit > settings.MAX_FETCH_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"Limit must be less than or equal to {settings.MAX_FETCH_LIMIT}"
        )
    return await crud_assignee.get_multi(db, skip=skip, limit=limit)

@router.get("/{assignee_id}", response_model=AssigneeResponse)
async def read_assignee(
    assignee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN]))
):
    assignee = await crud_assignee.get(db=db, id=assignee_id)
    if not assignee:
        raise HTTPException(
            status_code=404,
            detail="Assignee not found"
        )
    return assignee

@router.put("/{assignee_id}", response_model=AssigneeResponse)
async def update_assignee(
    assignee_id: int,
    assignee_in: AssigneeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN]))
):
    assignee = await crud_assignee.get(db=db, id=assignee_id)
    if not assignee:
        raise HTTPException(
            status_code=404,
            detail="Assignee not found"
        )
    assignee = await crud_assignee.update(db=db, db_obj=assignee, obj_in=assignee_in)
    return assignee

@router.delete("/{assignee_id}", response_model=AssigneeResponse)
async def delete_assignee(
    assignee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN]))
):  
    assignee = await crud_assignee.get(db=db, id=assignee_id)
    if not assignee:
        raise HTTPException(
            status_code=404,
            detail="Assignee not found"
        )
    assignee = await crud_assignee.remove(db=db, id=assignee_id)
    return assignee