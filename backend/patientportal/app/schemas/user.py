from pydantic import BaseModel
from typing import Optional, List
from core.roles import Role



class UserBase(BaseModel):
    username: str
    role: Role


class UserCreate(UserBase):
    password: str


class GuestUserCreate(UserBase):
    is_guest: bool = True
    password: Optional[str] = None


class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    remaining: int
    results: List[UserResponse]