from typing import List
from fastapi import WebSocket

class CounterWebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    async def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):

        disconnected_websockets = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                disconnected_websockets.append(connection)
        
        for websocket in disconnected_websockets:
            await self.disconnect(websocket)

counter_websocket_manager = CounterWebSocketManager()