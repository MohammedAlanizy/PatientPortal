from sqlalchemy.orm import Session
from models.user import User
from core.roles import Role
from crud import crud_user
from core.config import settings
import secrets

def init_guest_user(db: Session) -> None:
    guest_user = db.query(User).filter(User.is_guest == True).first()
    if not guest_user:
        guest_user = User(
            is_guest= True,  # Prevent deletion
            username="Guest",
            password=secrets.token_urlsafe(32),  # Random password
            role=Role.INSERTER,
        )
        crud_user.create(db, obj_in=guest_user)

def init_admin_user(db: Session) -> None:
    admin_user = db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()
    if not admin_user:
        admin_user = User(
            username=settings.ADMIN_USERNAME,
            password=settings.ADMIN_PASSWORD,
            role=Role.ADMIN,
        )
        crud_user.create(db, obj_in=admin_user)
        