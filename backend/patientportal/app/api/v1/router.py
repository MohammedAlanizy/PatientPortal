from fastapi import APIRouter
from app.api.v1.endpoints import users, requests, auth, assignees, websocket

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(requests.router, prefix="/requests", tags=["requests"])
api_router.include_router(assignees.router, prefix="/assignees", tags=["assignees"])
api_router.include_router(websocket.router, tags=["websocket"])