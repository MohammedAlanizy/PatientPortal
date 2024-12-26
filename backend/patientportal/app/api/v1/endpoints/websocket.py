from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from api.deps import get_current_user_ws
from models.user import User
from .websocket_manager import websocket_manager
from core.roles import Role

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    current_user: User = Depends(get_current_user_ws)
):
    try:
        await websocket_manager.connect(websocket, current_user.id)
        
        try:
            while True:
                # Keep the connection alive
                await websocket.receive_text()
        except WebSocketDisconnect:
            await websocket_manager.disconnect(websocket, current_user.id)
            
    except Exception as e:
        await websocket_manager.disconnect(websocket, current_user.id)
        raise e
