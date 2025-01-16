from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.core.roles import Role
from app.crud import crud_user
from app.core.config import settings
import secrets

async def init_guest_user(db: AsyncSession) -> None:
    result = await db.execute(
        select(User).filter(User.is_guest == True)
    )
    guest_user = result.scalars().first()
    if not guest_user:
        guest_user = User(
            is_guest=True,  # Prevent deletion
            username="Guest",
            password=secrets.token_urlsafe(32),  # Random password
            role=Role.INSERTER,
        )
        await crud_user.create_guest_user(db, obj_in=guest_user)

async def init_admin_user(db: AsyncSession) -> None:
    result = await db.execute(
        select(User).filter(User.username == settings.ADMIN_USERNAME)
    )
    admin_user = result.scalars().first()
    if not admin_user:
        admin_user = User(
            username=settings.ADMIN_USERNAME,
            password=settings.ADMIN_PASSWORD,
            role=Role.ADMIN,
        )
        await crud_user.create(db, obj_in=admin_user)
