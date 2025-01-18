from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.schemas.today_counter import ResponeCounter
from sqlalchemy import select
from app.models.today_counter import TodayCounter
from app.models.request import Request
from app.schemas.request import Status

from app.api.deps import get_db
router = APIRouter()


@router.get("/last", response_model=ResponeCounter)
async def get_last(
    db: AsyncSession = Depends(get_db),
):
    
    query = (
        select(TodayCounter)
        .join(Request, TodayCounter.request_id == Request.id)
        .filter(Request.status == Status.COMPLETED)
        .order_by(Request.updated_at.desc())  # Order by updated_at field
        .limit(1)
    )
    result = await db.execute(query)
    last_record = result.scalars().first()

    if not last_record:
        raise HTTPException(status_code=404, detail="No completed request found.")

    return ResponeCounter(
        request_id=last_record.request_id,
        last_counter=last_record.id,  
    )