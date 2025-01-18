from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.crud import crud_request
from app.models.request import Request
from app.schemas.request import RequestCreate, RequestUpdate, RequestResponse, RequestListResponse, RequestStats, Status
from sqlalchemy import case, func, select
from app.api.deps import get_db, get_current_user, get_optional_current_user, require_roles
from app.models.user import User
from app.core.roles import Role
from .websocket_manager import websocket_manager
from app.core.config import settings

router = APIRouter()

def parse_date_with_timezone(date_str: Optional[str]) -> Optional[datetime]:
    if not date_str:
        return None
    try:
        if 'T' in date_str:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00')).astimezone(timezone.utc)
        return datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return None

def get_date_range(date_val: datetime) -> tuple[datetime, datetime]:
    day_start = datetime.combine(date_val.date(), datetime.min.time()).replace(tzinfo=timezone.utc)
    day_end = datetime.combine(date_val.date(), datetime.max.time()).replace(tzinfo=timezone.utc)
    return day_start, day_end


@router.get("/stats", response_model=RequestStats)
async def get_request_stats(
    db: AsyncSession = Depends(get_db),
    today_date: str = None,
    current_user: User = Depends(require_roles([Role.ADMIN, Role.VERIFIER]))
):
    
    parsed_date = parse_date_with_timezone(today_date) or datetime.now(timezone.utc)

    day_start, day_end = get_date_range(parsed_date)
    year_start = datetime(parsed_date.year, 1, 1, tzinfo=timezone.utc)

    counts = await db.execute(
        select(
            func.count(Request.id).label("total"),
            func.sum(
                case((Request.status == Status.COMPLETED, 1), else_=0)
            ).label("completed"),
            func.sum(
                case((Request.status == Status.PENDING, 1), else_=0)
            ).label("pending"),
            func.sum(
                case((Request.created_at.between(day_start, day_end), 1), else_=0)
            ).label("today")
        ).filter(Request.created_at >= year_start)
    )

    result = counts.first()
    return RequestStats(
        total=result.total or 0,
        completed=result.completed or 0,
        pending=result.pending or 0,
        today=result.today or 0
    )


async def get_request_creator(
    request: RequestCreate,
    db: AsyncSession,
    current_user: Optional[User]
) -> int:
    if request.is_guest:
        query = select(User).filter(User.is_guest == True)
        result = await db.execute(query)
        guest_user = result.scalar_one_or_none()
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
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    # As requested by the user only make the notes avaliable to the admin and verifier
    if current_user is None or current_user.role not in [Role.ADMIN, Role.VERIFIER]:
        request.notes = None

    created_by = await get_request_creator(request, db, current_user)
    new_request = await crud_request.create(db, obj_in=request, created_by=created_by)
    
    # Get all users with ADMIN or VERIFIER roles to notify them
    query = select(User.id).filter(User.role.in_([Role.ADMIN, Role.VERIFIER, Role.INSERTER]))
    result = await db.execute(query)
    user_ids = [row[0] for row in result.all()]
    
    notification = {
        "type": "new_request",
        "data": {
            "id": new_request.id,
            "full_name": new_request.full_name,
            "medical_number": new_request.medical_number,
            "national_id": new_request.national_id,
            "status": new_request.status,
            "notes": new_request.notes,
            "created_at": new_request.created_at.astimezone(timezone.utc).isoformat()
        }
    }
    
    await websocket_manager.broadcast_to_users(user_ids, notification)
    return new_request

@router.delete("/{request_id}", response_model=RequestResponse)
async def delete_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN]))
):
    request = await crud_request.get(db, id=request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    deleted_request = await crud_request.remove(db, id=request_id)
    
    query = select(User.id).filter(User.role.in_([Role.ADMIN, Role.VERIFIER, Role.INSERTER]))
    result = await db.execute(query)
    user_ids = [row[0] for row in result.all()]
    
    notification = {
        "type": "deleted_request",
        "data": {
            "id": deleted_request.id,
            "full_name": deleted_request.full_name,
            "medical_number": deleted_request.medical_number,
            "national_id": deleted_request.national_id,
            "status": deleted_request.status,
            "created_at": deleted_request.created_at.astimezone(timezone.utc).isoformat(),
            "deleted_by": current_user.id
        }
    }
    
    await websocket_manager.broadcast_to_users(user_ids, notification)
    return deleted_request

@router.get("/", response_model=RequestListResponse)
async def read_requests(
    skip: int = 0,
    limit: int = settings.MAX_FETCH_LIMIT,
    status: Status = None,
    start_date: str = None,
    end_date: str = None,
    order_by: Optional[str] = "-updated_at, -created_at",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN, Role.VERIFIER, Role.INSERTER]))
):
    try:
        if limit > 10 and current_user.role == Role.INSERTER:
            raise HTTPException(
                status_code=400,
                detail="Can't fetch more than 10 requests at a time for INSERTER role"
            )
        if limit > settings.MAX_FETCH_LIMIT:
            raise HTTPException(
                status_code=400,
                detail=f"Limit must be less than or equal to {settings.MAX_FETCH_LIMIT}"
            )
        filters = {}
        if status:
            filters['status'] = status
        if start_date:
            start_datetime = parse_date_with_timezone(start_date)
            if start_datetime:
                filters['start_date'] = start_datetime
        if end_date:
            end_datetime = parse_date_with_timezone(end_date)
            if end_datetime:
                # Set to end of day for inclusive filtering
                _, day_end = get_date_range(end_datetime)
                filters['end_date'] = day_end
            
        requests = await crud_request.get_multi(
            db, skip=skip, limit=limit, filters=filters, order_by=order_by
        )
        return requests
        
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{request_id}", response_model=RequestResponse)
async def read_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN, Role.VERIFIER]))
):
    request = await crud_request.get(db, id=request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return request

@router.put("/{request_id}", response_model=RequestResponse)
async def update_request(
    request_id: int,
    request_in: RequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN, Role.VERIFIER]))
):
    try:
        request = await crud_request.get(db, id=request_id)
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        if request.status == Status.COMPLETED and current_user.role != Role.ADMIN:
            raise HTTPException(status_code=403, detail="Only admin can edit completed requests")
            
        request.status = Status.COMPLETED
        updated_request = await crud_request.update(db, db_obj=request, obj_in=request_in)
        
        query = select(User.id).filter(User.role.in_([Role.ADMIN, Role.VERIFIER, Role.INSERTER]))
        result = await db.execute(query)
        user_ids = [row[0] for row in result.all()]
        
        notification = {
            "type": "updated_request",
            "data": {
                "id": updated_request.id,
                "full_name": updated_request.full_name,
                "status": updated_request.status,
                "updated_at": updated_request.updated_at.astimezone(timezone.utc).isoformat() if updated_request.updated_at else None,
                "medical_number": updated_request.medical_number,
                "notes": updated_request.notes,
                "assigned_to": updated_request.assigned_to,
                "created_at": updated_request.created_at.astimezone(timezone.utc).isoformat(),
                "updated_by": current_user.id
            }
        }
        
        await websocket_manager.broadcast_to_users(user_ids, notification)
        return updated_request
        
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))