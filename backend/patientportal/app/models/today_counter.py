from sqlalchemy import Column, Integer,ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base
class TodayCounter(Base):
    __tablename__ = "today_counter"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("requests.id"))

    reqeuested = relationship("Request", foreign_keys=[request_id], lazy="joined")