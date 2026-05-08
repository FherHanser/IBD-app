"""
Endpoints REST de la API.
"""

from fastapi import APIRouter, HTTPException
from scheduler import get_market_state
from analysis.signals import get_market_session
from data.fetcher import get_last_fetch_time, get_quote_snapshot
from analysis.rankings import build_stock_entry
from data.universe import STOCK_UNIVERSE, get_company_name, COMPANY_NAMES

router = APIRouter()

# Watchlist simple en memoria (en producción iría a SQLite)
_watchlist: list[str] = ["NVDA", "AMD", "TSLA", "AAPL", "NET", "CRWD"]


@router.get("/health")
def health():
    return {"status": "ok", "service": "stock-monitor"}


@router.get("/market/status")
def market_status():
    session = get_market_session()
    state = get_market_state()
    return {
        **session,
        "last_update": state.get("last_update"),
        "total_processed": state.get("total_processed", 0),
        "data_status": state.get("status", "unknown"),
    }


@router.get("/stocks/gainers")
def get_gainers():
    state = get_market_state()
    return {
        "data": state.get("gainers", []),
        "last_update": state.get("last_update"),
    }


@router.get("/stocks/losers")
def get_losers():
    state = get_market_state()
    return {
        "data": state.get("losers", []),
        "last_update": state.get("last_update"),
    }


@router.get("/stocks/opportunities/low")
def get_opp_low():
    state = get_market_state()
    return {"data": state.get("opp_low", []), "last_update": state.get("last_update")}


@router.get("/stocks/opportunities/mid")
def get_opp_mid():
    state = get_market_state()
    return {"data": state.get("opp_mid", []), "last_update": state.get("last_update")}


@router.get("/stocks/opportunities/top")
def get_opp_top():
    state = get_market_state()
    return {"data": state.get("opp_top", []), "last_update": state.get("last_update")}


@router.get("/alerts")
def get_alerts():
    state = get_market_state()
    return {
        "data": state.get("alerts", []),
        "last_update": state.get("last_update"),
    }


@router.get("/stocks/{symbol}")
def get_stock_detail(symbol: str):
    """Detalle completo de una acción específica."""
    symbol = symbol.upper()
    if symbol not in STOCK_UNIVERSE:
        raise HTTPException(status_code=404, detail=f"Símbolo {symbol} no encontrado en el universo")

    snapshots = get_quote_snapshot(symbols=[symbol])
    if not snapshots:
        raise HTTPException(status_code=503, detail="No se pudieron obtener datos para este símbolo")

    entry = build_stock_entry(snapshots[0])
    return {"data": entry}


@router.get("/watchlist")
def get_watchlist():
    state = get_market_state()
    all_entries = (
        state.get("gainers", [])
        + state.get("losers", [])
        + state.get("opportunities", [])
    )
    entry_map = {e["symbol"]: e for e in all_entries}

    result = []
    for sym in _watchlist:
        if sym in entry_map:
            result.append(entry_map[sym])
        else:
            result.append({"symbol": sym, "name": get_company_name(sym), "status": "no_data"})

    return {"data": result, "symbols": _watchlist}


@router.post("/watchlist/{symbol}")
def add_to_watchlist(symbol: str):
    symbol = symbol.upper()
    if symbol not in STOCK_UNIVERSE:
        raise HTTPException(status_code=404, detail=f"Símbolo {symbol} no en el universo monitoreable")
    if symbol not in _watchlist:
        _watchlist.append(symbol)
    return {"message": f"{symbol} agregado a watchlist", "watchlist": _watchlist}


@router.delete("/watchlist/{symbol}")
def remove_from_watchlist(symbol: str):
    symbol = symbol.upper()
    if symbol in _watchlist:
        _watchlist.remove(symbol)
    return {"message": f"{symbol} removido de watchlist", "watchlist": _watchlist}


@router.get("/universe")
def get_universe():
    return {
        "symbols": STOCK_UNIVERSE,
        "total": len(STOCK_UNIVERSE),
        "names": COMPANY_NAMES,
    }
