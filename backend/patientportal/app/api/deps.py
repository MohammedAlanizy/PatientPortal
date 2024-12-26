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

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: Optional[int] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except (JWTError, ValidationError):
        raise credentials_exception
    
    user = crud_user.get(db, id=int(user_id))
    if user is None:
        raise credentials_exception
    return user


def require_roles(required_role: List[Role]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_role:
            raise HTTPException(
                status_code=403, 
                detail=f"User does not have the required role: {required_role}"
            )
        return current_user
    return role_checker

def get_current_user_ws(
    websocket: WebSocket,
    db: Session = Depends(get_db),
) -> User:
    try:
        token = websocket.query_params.get("token")
        if not token:
            raise HTTPException(status_code=403, detail="Not authenticated")
            
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: int = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=403, detail="Invalid authentication token")
            
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        return user
        
    except jwt.JWTError:
        raise HTTPException(status_code=403, detail="Invalid authentication token")
