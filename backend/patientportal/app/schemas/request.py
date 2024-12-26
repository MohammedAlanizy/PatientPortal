from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import datetime
from enum import Enum
from schemas.user import UserResponse
from schemas.assignee import AssigneeResponse

class Status(str, Enum):
    COMPLETED = "completed"
    PENDING = "pending"

class RequestBase(BaseModel):
    full_name: str
    national_id: int
    medical_number: Optional[int] = None

class RequestCreate(RequestBase):
    pass

class RequestUpdate(BaseModel):
    medical_number: Optional[int] = None
    notes: Optional[str] = None
    assigned_to: int

class RequestResponse(RequestBase):
    id: int
    assignee: Optional[AssigneeResponse]
    creator: Optional[UserResponse]
    full_name: str = None
    created_at: datetime
    updated_at: Optional[datetime]
    notes: Optional[str]
    status: Status

    class Config:
        from_attributes = True

class RequestStats(BaseModel):
    total: int
    completed: int
    pending: int

    class Config:
        from_attributes = True

class RequestListResponse(BaseModel):
    remaining: int
    results: List[RequestResponse]
