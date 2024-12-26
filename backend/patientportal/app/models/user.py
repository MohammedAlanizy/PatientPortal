from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from db.base_class import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    
    requests = relationship("Request", back_populates="creator", foreign_keys="[Request.created_by]")