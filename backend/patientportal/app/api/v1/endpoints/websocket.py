from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.api.deps import get_current_user_ws
from app.models.user import User
from .websocket_manager import websocket_manager
from .websocket_counter_manager import counter_websocket_manager
from app.core.roles import Role

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    current_user: User = Depends(get_current_user_ws)
):
    try:
        await websocket_manager.connect(websocket, current_user.id)
        # await websocket.send_text("Connection established")
        try:
            while True:
                # Keep the connection alive
                await websocket.receive_text()
        except WebSocketDisconnect:
            await websocket_manager.disconnect(websocket, current_user.id)
            
    except Exception as e:
        await websocket_manager.disconnect(websocket, current_user.id)
        raise e
    
@router.websocket("/counter")
async def counter_websocket_endpoint(websocket: WebSocket):
    try:
        await counter_websocket_manager.connect(websocket)
        
        try:
            while True:
                await websocket.receive_text()
        except WebSocketDisconnect:
            await counter_websocket_manager.disconnect(websocket)
    except Exception as e:
        await counter_websocket_manager.disconnect(websocket)
        raise e
