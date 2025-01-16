from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, GuestUserCreate
from app.core.security import get_password_hash, verify_password

class CRUDUser(CRUDBase[User, UserCreate, None]):
    async def create(self, db: AsyncSession, *, obj_in: UserCreate) -> User:
        db_obj = User(
            username=obj_in.username,
            password=get_password_hash(obj_in.password),
            role=obj_in.role,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_by_username(self, db: AsyncSession, *, username: str) -> Optional[User]:
        query = select(User).filter(User.username == username)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def authenticate(self, db: AsyncSession, *, username: str, password: str) -> Optional[User]:
        user = await self.get_by_username(db, username=username)
        if not user:
            return None
        if not verify_password(password, user.password):
            return None
        return user
    
    async def create_guest_user(self, db: AsyncSession, *, obj_in: GuestUserCreate) -> User:
        db_obj = User(
            username=obj_in.username,
            is_guest=True,
            password=get_password_hash(obj_in.password),
            role=obj_in.role,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

crud_user = CRUDUser(User)