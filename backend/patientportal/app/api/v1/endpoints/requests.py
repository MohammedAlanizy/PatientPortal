from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from crud import crud_request
from models.request import Request
from schemas.request import RequestCreate, RequestUpdate, RequestResponse, RequestListResponse,RequestStats, Status
from sqlalchemy import func
from api.deps import get_db, get_current_user, get_optional_current_user, require_roles
from models.user import User
from core.roles import Role
from .websocket_manager import websocket_manager
from typing import Optional
router = APIRouter()



@router.get("/stats", response_model=RequestStats)
def get_request_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN, Role.VERIFIER]))
):
    total_count = db.query(func.count(Request.id)).scalar() or 0
    
    completed_count = (
        db.query(func.count(Request.id))
        .filter(Request.status == Status.COMPLETED)
        .scalar() or 0
    )
    
    pending_count = (
        db.query(func.count(Request.id))
        .filter(Request.status == Status.PENDING)
        .scalar() or 0
    )

    return RequestStats(
        total=total_count,
        completed=completed_count,
        pending=pending_count
    )

def get_request_creator(
    request: RequestCreate,
    db: Session,
    current_user: Optional[User]
) -> int:

    if request.is_guest:
        guest_user = db.query(User).filter(User.is_guest == True).first()
        if not guest_user:
            raise HTTPException(
                status_code=500,
                detail="Guest user not properly initialized"
            )
        return guest_user.id
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for non-guest requests"
        )
    return current_user.id


@router.post("/", response_model=RequestResponse)
async def create_request(
    request: RequestCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
     
    created_by = get_request_creator(request, db, current_user)
    
    new_request = crud_request.create(db, obj_in=request, created_by=created_by)
    
    # Get all users with ADMIN or VERIFIER roles to notify them
    admin_verifier_users = db.query(User.id).filter(
        User.role.in_([Role.ADMIN, Role.VERIFIER])
    ).all()
    user_ids = [user.id for user in admin_verifier_users]
    
    # Prepare notification message
    notification = {
        "type": "new_request",
        "data": {
            "id": new_request.id,
            "full_name": new_request.full_name,
            "medical_number": new_request.medical_number,
            "national_id": new_request.national_id,
            "status": new_request.status,
            "created_at": new_request.created_at.isoformat()
        }
    }
    
    # Broadcast to all relevant users
    await websocket_manager.broadcast_to_users(user_ids, notification)

    return new_request

@router.get("/", response_model=RequestListResponse)
def read_requests(
    skip: int = 0,
    limit: int = 100,
    status: Status = None,
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN, Role.VERIFIER]))
):
    # status will get from body 
    filters = {}
    if status:
        filters['status'] = status
    # startDate and endDate will get from body
    if start_date:
        filters['start_date'] = start_date
    if end_date:
        filters['end_date'] = end_date
    requests = crud_request.get_multi(db, skip=skip, limit=limit, filters=filters, join_relationships=["assignee"])
    return requests

@router.get("/{request_id}", response_model=RequestResponse)
def read_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN, Role.VERIFIER]))
):
    request = crud_request.get(db, id=request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return request

@router.put("/{request_id}", response_model=RequestResponse)
async def update_request(
    request_id: int,
    request_in: RequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN, Role.VERIFIER]))
):
    request = crud_request.get(db, id=request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.status == Status.COMPLETED:
        if current_user.role != Role.ADMIN:
            raise HTTPException(status_code=403, detail="Only admin can edit completed requests")
        
    request.status = Status.COMPLETED
    updated_request = crud_request.update(db, db_obj=request, obj_in=request_in)
    
    # Get all users with ADMIN or VERIFIER roles to notify them
    admin_verifier_users = db.query(User.id).filter(
        User.role.in_([Role.ADMIN, Role.VERIFIER])
    ).all()
    user_ids = [user.id for user in admin_verifier_users]
    
    # Also don't notify the user who updated the request
    # I know this is always be true, but just to be safe :)
    if current_user.id in user_ids:
        user_ids.remove(current_user.id)

    
    
    notification = {
        "type": "updated_request",
        "data": {
            "id": updated_request.id,
            "full_name": updated_request.full_name,
            "status": updated_request.status,
            "updated_at": updated_request.updated_at.isoformat() if updated_request.updated_at else None,
            "medical_number": updated_request.medical_number,
            "notes": updated_request.notes,
            "assigned_to": updated_request.assigned_to,
            "updated_by": current_user.id
        }
    }
    
    # Broadcast to all relevant users
    await websocket_manager.broadcast_to_users(user_ids, notification)
    
    return updated_request

