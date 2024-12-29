from typing import Optional
from sqlalchemy.orm import Session
from crud.base import CRUDBase
from models.user import User
from schemas.user import UserCreate
from core.security import get_password_hash,verify_password 

class CRUDUser(CRUDBase[User, UserCreate, None]):
    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        db_obj = User(
            username=obj_in.username,
            password=get_password_hash(obj_in.password),
            role=obj_in.role,
            is_guest=obj_in.is_guest if obj_in.is_guest else False
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_by_username(self, db: Session, *, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    def authenticate(self, db: Session, *, username: str, password: str) -> Optional[User]:
        user = self.get_by_username(db, username=username)
        if not user:
            return None
        if not verify_password(password, user.password):
            return None
        return user

crud_user = CRUDUser(User)