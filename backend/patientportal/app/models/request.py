from sqlalchemy import Column, Integer,BigInteger, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.schemas.request import Status
class Request(Base):
    __tablename__ = "requests"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    national_id = Column(BigInteger, nullable=False)
    medical_number = Column(BigInteger, nullable=True)
    notes = Column(String(255), nullable=True)
    status = Column(String(20), nullable=True, default=Status.PENDING)
    created_by = Column(Integer, ForeignKey("users.id"))
    assigned_to = Column(Integer, ForeignKey("assignees.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", back_populates="requests", foreign_keys=[created_by], lazy="joined")
    assignee = relationship("Assignee", back_populates="assigned_requests", foreign_keys=[assigned_to], lazy="joined")

    
    counter = relationship(
        "TodayCounter",
        back_populates="full_request",
        cascade="all, delete-orphan",
        foreign_keys="[TodayCounter.request_id]",
        lazy="joined",
        uselist=False  
    )

