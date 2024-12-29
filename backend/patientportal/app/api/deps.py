from typing import Generator, Optional, List
from fastapi import WebSocket, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session
from db.session import SessionLocal
from core.config import settings
from crud import crud_user
from models.user import User
from core.roles import Role

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()


def _decode_and_get_user(
    db: Session,
    token: Optional[str],
    raise_on_invalid: bool = True
) -> Optional[User]:
    if not token:
        if raise_on_invalid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return None
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: Optional[int] = payload.get("sub")
        if not user_id:
            raise ValueError("Invalid token payload")
        
        user = crud_user.get(db, id=int(user_id))
        if not user:
            raise ValueError("User not found")
        return user

    except (JWTError, ValidationError, ValueError):
        if raise_on_invalid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return None


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    return _decode_and_get_user(db, token, raise_on_invalid=True)


async def get_optional_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    return _decode_and_get_user(db, token, raise_on_invalid=False)


def require_roles(required_role: List[Role]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_role:
            raise HTTPException(
                status_code=403,
                detail=f"User does not have the required role: {required_role}",
            )
        return current_user
    return role_checker


def get_current_user_ws(
    websocket: WebSocket,
    db: Session = Depends(get_db)
) -> User:
    token = websocket.query_params.get("token")
    if not token:
        raise HTTPException(status_code=403, detail="Not authenticated")
    return _decode_and_get_user(db, token, raise_on_invalid=True)
