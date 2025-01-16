from typing import AsyncGenerator, Optional, List
from fastapi import WebSocket, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.core.config import settings
from app.crud import crud_user
from app.models.user import User
from app.core.roles import Role

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise

async def _decode_and_get_user(
    db: AsyncSession,
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
        
        user = await crud_user.get(db, id=int(user_id))
        if not user:
            raise ValueError("User not found")
        return user

    except (JWTError, ValidationError, ValueError) as e:
        if raise_on_invalid:
            print(e)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return None

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    return await _decode_and_get_user(db, token, raise_on_invalid=True)

async def get_optional_current_user(
    db: AsyncSession = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    return await _decode_and_get_user(db, token, raise_on_invalid=False)

def require_roles(required_roles: List[Role]):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=403,
                detail=f"User does not have the required roles: {required_roles}",
            )
        return current_user
    return role_checker

async def get_current_user_ws(
    websocket: WebSocket,
    db: AsyncSession = Depends(get_db)
) -> User:
    token = websocket.query_params.get("token")
    if not token:
        
        raise HTTPException(status_code=403, detail="Not authenticated")
    return await _decode_and_get_user(db, token, raise_on_invalid=True)