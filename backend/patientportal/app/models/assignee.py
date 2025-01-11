from sqlalchemy import Column, Integer, String
from app.db.base_class import Base
from sqlalchemy.orm import relationship

class Assignee(Base):
    __tablename__ = "assignees"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    assigned_requests = relationship("Request", back_populates="assignee", foreign_keys="[Request.assigned_to]")
