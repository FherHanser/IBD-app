"""
WebSocket endpoint — emite actualizaciones en tiempo real a todos los clientes.
"""

import asyncio
import json
import logging
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from scheduler import register_broadcast, get_market_state

logger = logging.getLogger(__name__)

ws_router = APIRouter()

# Conjunto de conexiones activas
_active_connections: set[WebSocket] = set()


@ws_router.websocket("/ws/market")
async def market_websocket(websocket: WebSocket):
    await websocket.accept()
    _active_connections.add(websocket)
    client = websocket.client
    logger.info(f"WebSocket conectado: {client} — Total: {len(_active_connections)}")

    try:
        # Enviar el estado actual inmediatamente al conectarse
        state = get_market_state()
        if state.get("status") != "initializing":
            await websocket.send_text(json.dumps({
                "type": "market_update",
                **_sanitize_state(state),
            }, default=str))
        else:
            await websocket.send_text(json.dumps({
                "type": "initializing",
                "message": "Cargando datos del mercado, espera un momento...",
            }))

        # Mantener la conexión viva esperando mensajes del cliente (ping/pong)
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                if data == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except asyncio.TimeoutError:
                # Enviar heartbeat si no hay actividad
                await websocket.send_text(json.dumps({"type": "heartbeat"}))

    except WebSocketDisconnect:
        logger.info(f"WebSocket desconectado: {client}")
    except Exception as e:
        logger.debug(f"WebSocket error: {e}")
    finally:
        _active_connections.discard(websocket)
        logger.info(f"WebSocket removido. Total activos: {len(_active_connections)}")


async def broadcast_market_update(state: dict):
    """Emite el estado actualizado a todos los clientes conectados."""
    if not _active_connections:
        return

    message = json.dumps({
        "type": "market_update",
        **_sanitize_state(state),
    }, default=str)

    disconnected = set()
    for ws in _active_connections:
        try:
            await ws.send_text(message)
        except Exception:
            disconnected.add(ws)

    for ws in disconnected:
        _active_connections.discard(ws)


def _sanitize_state(state: dict) -> dict:
    """Prepara el estado para serialización JSON (remueve DataFrames)."""
    return {
        "last_update":     state.get("last_update"),
        "market_session":  state.get("market_session", {}),
        "gainers":         state.get("gainers", []),
        "losers":          state.get("losers", []),
        "opp_low":         state.get("opp_low", []),
        "opp_mid":         state.get("opp_mid", []),
        "opp_top":         state.get("opp_top", []),
        "alerts":          state.get("alerts", []),
        "total_processed": state.get("total_processed", 0),
        "status":          state.get("status", "unknown"),
    }


# Registrar el callback de broadcast en el scheduler
register_broadcast(broadcast_market_update)
