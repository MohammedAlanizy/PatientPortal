from pydantic import BaseModel
from typing import Optional, List

class AssigneeBase(BaseModel):
    full_name: str

class AssigneeCreate(AssigneeBase):
    pass

class AssigneeUpdate(BaseModel):
    full_name: Optional[str] = None

class AssigneeResponse(AssigneeBase):
    id: int

    class Config:
        from_attributes = True

class AssigneeListResponse(BaseModel):
    remaining: int
    results: List[AssigneeResponse]
    class Config:
        from_attributes = True

class AssigneeStats(AssigneeBase):

    completed: int

    class Config:
        from_attributes = True

class AssigneeStatsResponse(BaseModel):
    stats: List[AssigneeStats]

    class Config:
        from_attributes = True