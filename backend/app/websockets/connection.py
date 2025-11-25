from __future__ import annotations

import asyncio
from typing import Any, Awaitable, Callable, Dict, List

from fastapi import WebSocket


EventListener = Callable[[Dict[str, Any]], Awaitable[None]]


class ConnectionManager:
    """Tracks websocket connections per channel and cleans them up safely."""

    def __init__(self) -> None:
        self._connections: Dict[str, List[WebSocket]] = {}
        self._connection_to_channel: Dict[int, str] = {}
        self._listeners: Dict[str, List[EventListener]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, channel: str) -> None:
        """Accept a socket and register it to a logical channel."""
        await websocket.accept()
        async with self._lock:
            self._connections.setdefault(channel, []).append(websocket)
            self._connection_to_channel[id(websocket)] = channel

    async def disconnect(self, websocket: WebSocket) -> None:
        """Remove the socket from tracking structures and close it if needed."""
        async with self._lock:
            channel = self._connection_to_channel.pop(id(websocket), None)
            if not channel:
                return

            socket_list = self._connections.get(channel)
            if not socket_list:
                return

            try:
                socket_list.remove(websocket)
            except ValueError:
                pass

            if not socket_list:
                # Drop empty lists to prevent unbounded growth
                self._connections.pop(channel, None)
                self._listeners.pop(channel, None)

        try:
            await websocket.close()
        except Exception:
            # Socket may already be closed – swallow errors to avoid leaking tasks
            pass

    async def broadcast(self, channel: str, message: Dict[str, Any]) -> None:
        """Send a payload to all sockets listening on a channel."""
        sockets = list(self._connections.get(channel, []))
        for socket in sockets:
            try:
                await socket.send_json(message)
            except Exception:
                # If a socket fails, drop it to avoid leaks
                await self.disconnect(socket)

    def add_listener(self, channel: str, listener: EventListener) -> None:
        """Register background listeners for server-side events."""
        listeners = self._listeners.setdefault(channel, [])
        if listener not in listeners:
            listeners.append(listener)

    def remove_listener(self, channel: str, listener: EventListener) -> None:
        listeners = self._listeners.get(channel)
        if not listeners:
            return
        if listener in listeners:
            listeners.remove(listener)
        if not listeners:
            self._listeners.pop(channel, None)

    async def emit(self, channel: str, payload: Dict[str, Any]) -> None:
        """Dispatch a payload to registered event listeners."""
        for listener in list(self._listeners.get(channel, [])):
            await listener(payload)

    async def shutdown(self) -> None:
        """Close and clear all tracked sockets (used during lifespan shutdown)."""
        sockets: List[WebSocket] = []
        async with self._lock:
            for channel_sockets in self._connections.values():
                sockets.extend(channel_sockets)
            self._connections.clear()
            self._connection_to_channel.clear()
            self._listeners.clear()

        for socket in sockets:
            try:
                await socket.close()
            except Exception:
                pass


connection_manager = ConnectionManager()

