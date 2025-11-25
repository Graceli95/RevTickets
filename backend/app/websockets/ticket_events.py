from __future__ import annotations

import json
from typing import Any, Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from .connection import connection_manager

router = APIRouter()


@router.websocket("/ws/tickets/{ticket_id}")
async def ticket_updates_socket(websocket: WebSocket, ticket_id: str) -> None:
    """
    Lightweight WebSocket endpoint that streams ticket updates to listeners.
    Ensures every connection is registered and cleaned up to avoid memory leaks.
    """
    await connection_manager.connect(websocket, ticket_id)

    try:
        while True:
            try:
                payload = await websocket.receive_text()
                if not payload:
                    continue

                data = json.loads(payload)
                if isinstance(data, dict) and data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except json.JSONDecodeError:
                # Ignore malformed client messages but keep connection alive
                continue
    except WebSocketDisconnect:
        pass
    finally:
        await connection_manager.disconnect(websocket)


async def broadcast_ticket_event(ticket_id: str, event: str, data: Dict[str, Any]) -> None:
    """Helper used by services to push updates to all subscribers of a ticket."""
    payload = {"type": event, "data": data}
    await connection_manager.broadcast(ticket_id, payload)

