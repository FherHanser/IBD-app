"""
Scheduler de actualización de mercado.
- Cada 60 seg: fetch completo de todos los símbolos
- Cada 30 seg (si mercado abierto): broadcast WebSocket
"""

import asyncio
import logging
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from config import FETCH_INTERVAL_SECONDS, FAST_FETCH_INTERVAL_SECONDS, DETAILED_TOP_N
from data.universe import STOCK_UNIVERSE
from data.fetcher import get_quote_snapshot, fetch_detailed, fetch_daily_context
from analysis.rankings import compute_rankings
from analysis.signals import generate_alerts, get_market_session
from data.db import save_opportunity_alert, close_old_alerts, get_win_stats

logger = logging.getLogger(__name__)

_scheduler = AsyncIOScheduler()

# Estado compartido en memoria (leído por la API y el WebSocket)
market_state: dict = {
    "last_update": None,
    "market_session": {},
    "gainers": [],
    "losers": [],
    "opp_low": [],
    "opp_mid": [],
    "opp_top": [],
    "alerts": [],
    "total_processed": 0,
    "status": "initializing",
    "win_stats": {},
}

# Callbacks WebSocket (registrados por api/websocket.py)
_ws_broadcast_callback = None
_consecutive_errors = 0


def register_broadcast(callback):
    global _ws_broadcast_callback
    _ws_broadcast_callback = callback


async def _update_market_data():
    """Tarea principal: fetch + cálculo + actualización de estado."""
    global market_state

    session = get_market_session()
    logger.info(f"Actualizando datos — Sesión: {session['label']}")

    try:
        # Contexto diario (prev close/high/low, avg volume) — cache 30 min
        daily_context = fetch_daily_context(symbols=STOCK_UNIVERSE)

        # Fetch batch de todos los símbolos
        snapshots = get_quote_snapshot(symbols=STOCK_UNIVERSE, daily_context=daily_context)

        if not snapshots:
            logger.warning("No se obtuvieron snapshots")
            market_state["status"] = "error_fetch"
            return

        # Para los top movers, obtener datos 1m más precisos
        top_by_volume = sorted(snapshots, key=lambda s: abs(s["change_pct"]), reverse=True)
        top_symbols = [s["symbol"] for s in top_by_volume[:DETAILED_TOP_N]]

        detailed = fetch_detailed(top_symbols)
        for snap in snapshots:
            if snap["symbol"] in detailed:
                snap["df"] = detailed[snap["symbol"]]

        global _consecutive_errors
        _consecutive_errors = 0  # reset en ciclo exitoso

        # Calcular rankings
        rankings = compute_rankings(snapshots)

        # Generar alertas usando todos los candidatos de oportunidad
        all_opp = rankings["opp_low"] + rankings["opp_mid"] + rankings["opp_top"]
        all_entries = rankings["gainers"] + rankings["losers"] + all_opp
        alerts = generate_alerts(all_entries)

        # Persistencia: cerrar alertas de ayer + guardar nuevas oportunidades
        price_map = {s["symbol"]: s["price"] for s in snapshots if "price" in s}
        await close_old_alerts(price_map)

        for bucket, label in [("opp_low", "opp_low"), ("opp_mid", "opp_mid"), ("opp_top", "opp_top")]:
            for entry in rankings[bucket]:
                await save_opportunity_alert(
                    symbol=entry["symbol"],
                    price=entry["price"],
                    score=entry["score"],
                    signal_type=entry.get("signal_type", ""),
                    setup_key=entry.get("setup_key", ""),
                    price_range=label,
                )

        win_stats = await get_win_stats()

        # Actualizar estado global
        market_state.update({
            "last_update": datetime.utcnow().isoformat() + "Z",
            "market_session": session,
            "gainers": rankings["gainers"],
            "losers": rankings["losers"],
            "opp_low": rankings["opp_low"],
            "opp_mid": rankings["opp_mid"],
            "opp_top": rankings["opp_top"],
            "alerts": alerts,
            "total_processed": rankings.get("total_processed", 0),
            "status": "ok",
            "win_stats": win_stats,
        })

        logger.info(
            f"Estado actualizado: {len(rankings['gainers'])} ganadoras, "
            f"{len(rankings['losers'])} perdedoras, "
            f"opp={len(rankings['opp_low'])}+{len(rankings['opp_mid'])}+{len(rankings['opp_top'])}"
        )

        # Emitir por WebSocket a todos los clientes conectados
        if _ws_broadcast_callback:
            await _ws_broadcast_callback(market_state)

    except Exception as e:
        global _consecutive_errors
        _consecutive_errors += 1
        logger.error(f"Error en _update_market_data ({_consecutive_errors} consecutivos): {e}", exc_info=True)
        # Solo marcar error si falla 3 veces seguidas y no hay datos previos
        if _consecutive_errors >= 3 or market_state.get("total_processed", 0) == 0:
            market_state["status"] = "error"


async def start_scheduler():
    """Inicia el scheduler y hace la primera carga inmediatamente."""
    _scheduler.add_job(
        _update_market_data,
        trigger=IntervalTrigger(seconds=FETCH_INTERVAL_SECONDS),
        id="market_update",
        max_instances=1,
        replace_existing=True,
    )
    _scheduler.start()
    logger.info(f"Scheduler iniciado (intervalo: {FETCH_INTERVAL_SECONDS}s)")

    # Primera ejecución inmediata en background
    asyncio.create_task(_update_market_data())


async def stop_scheduler():
    if _scheduler.running:
        _scheduler.shutdown(wait=False)


def get_market_state() -> dict:
    return market_state
