from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.crud import crud_user
from app.schemas.user import UserCreate, UserResponse, UserListResponse
from app.api.deps import get_db, get_current_user, require_roles
from app.core.roles import Role
from app.models.user import User
from app.core.config import settings
router = APIRouter()

@router.post("/", response_model=UserResponse)
async def create_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN]))
):
    existing_user = await crud_user.get_by_username(db, username=user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return await crud_user.create(db, obj_in=user)

@router.get("/me", response_model=UserResponse)
async def read_user_me(
    current_user: User = Depends(get_current_user)
):
    return current_user

@router.get("/", response_model=UserListResponse)
async def read_users(
    skip: int = 0,
    limit: int = settings.MAX_FETCH_LIMIT,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN]))
):
    if limit > settings.MAX_FETCH_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"Limit must be less than or equal to {settings.MAX_FETCH_LIMIT}"
        )
    return await crud_user.get_multi(db, skip=skip, limit=limit)

@router.delete("/{user_id}", response_model=UserResponse)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.ADMIN]))
):
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Can't delete yourself!")
    if user.is_guest:
        raise HTTPException(status_code=400, detail="Can't delete guest user!")
    return await crud_user.remove(db, id=user_id)