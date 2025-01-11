from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.crud import crud_user
from app.schemas.user import UserCreate, UserResponse, UserListResponse
from app.api.deps import get_db, get_current_user,require_roles
from app.core.roles import Role
from app.models.user import User

router = APIRouter()

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db), 
                current_user: User = Depends(require_roles([Role.ADMIN]))):
    db_user = crud_user.get_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud_user.create(db, obj_in=user)

@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/", response_model=UserListResponse)
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db),
               current_user: User = Depends(require_roles([Role.ADMIN]))):
    return crud_user.get_multi(db, skip=skip, limit=limit)

@router.delete("/{user_id}", response_model=UserResponse)
def delete_user(user_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(require_roles([Role.ADMIN]))):
    user = crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Can't delete yourself!")
    if user.is_guest:
        raise HTTPException(status_code=400, detail="Can't delete guest user!")
    return crud_user.remove(db, id=user_id)