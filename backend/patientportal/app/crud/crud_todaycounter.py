from app.crud.base import CRUDBase
from app.models.today_counter import TodayCounter
from app.schemas.today_counter import RequestCounter

class CRUDTCounter(CRUDBase[TodayCounter, RequestCounter, None]):
    pass


crud_todaycounter = CRUDTCounter(TodayCounter)