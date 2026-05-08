"""
Módulo de obtención de datos via yfinance.
Estrategia:
  - Cada 60 seg: batch intraday 5m para todos los símbolos
  - Para top movers: 1m para mayor precisión
  - Cada 30 min: contexto diario (prev close/high/low, avg volume)
"""

import logging
from datetime import datetime
from typing import Optional
import pandas as pd
import yfinance as yf

from data.universe import STOCK_UNIVERSE, get_company_name

logger = logging.getLogger(__name__)

_price_cache: dict[str, pd.DataFrame] = {}
_daily_context_cache: dict[str, dict] = {}   # prev close, prev high, prev low, avg vol
_last_fetch: Optional[datetime] = None
_last_daily_fetch: Optional[datetime] = None

DAILY_CONTEXT_TTL_MINUTES = 30


def fetch_all_stocks(symbols: list[str] = None, interval: str = "5m") -> dict[str, pd.DataFrame]:
    """Descarga datos intradía para todos los símbolos en un solo batch."""
    if symbols is None:
        symbols = STOCK_UNIVERSE

    logger.info(f"Descargando {len(symbols)} símbolos (interval={interval})...")
    try:
        raw = yf.download(
            tickers=" ".join(symbols),
            period="1d",
            interval=interval,
            group_by="ticker",
            auto_adjust=True,
            progress=False,
            threads=True,
        )
    except Exception as e:
        logger.error(f"Error en yf.download: {e}")
        return {}

    result: dict[str, pd.DataFrame] = {}

    if len(symbols) == 1:
        sym = symbols[0]
        if not raw.empty:
            result[sym] = raw.copy()
        _price_cache.update(result)
        return result

    for sym in symbols:
        try:
            df = raw[sym].dropna(how="all")
            if not df.empty:
                result[sym] = df
        except KeyError:
            pass

    global _last_fetch
    _last_fetch = datetime.utcnow()
    _price_cache.update(result)
    logger.info(f"Datos obtenidos para {len(result)}/{len(symbols)} símbolos")
    return result


def fetch_daily_context(symbols: list[str] = None) -> dict[str, dict]:
    """
    Descarga datos diarios (5 días) para obtener:
    - Cierre anterior, máximo anterior, mínimo anterior
    - Volumen promedio diario
    Usa cache de 30 minutos para no saturar yfinance.
    """
    global _last_daily_fetch, _daily_context_cache

    now = datetime.utcnow()
    if (
        _last_daily_fetch
        and (now - _last_daily_fetch).total_seconds() < DAILY_CONTEXT_TTL_MINUTES * 60
        and _daily_context_cache
    ):
        return _daily_context_cache

    if symbols is None:
        symbols = STOCK_UNIVERSE

    logger.info(f"Descargando contexto diario para {len(symbols)} símbolos...")
    try:
        raw = yf.download(
            tickers=" ".join(symbols),
            period="5d",
            interval="1d",
            group_by="ticker",
            auto_adjust=True,
            progress=False,
            threads=True,
        )
    except Exception as e:
        logger.error(f"Error en fetch_daily_context: {e}")
        return _daily_context_cache

    context: dict[str, dict] = {}

    def _extract(sym: str, df: pd.DataFrame):
        if df is None or len(df) < 2:
            return
        df = df.dropna(how="all")
        if len(df) < 2:
            return
        prev = df.iloc[-2]
        context[sym] = {
            "prev_close": round(float(prev["Close"]), 2),
            "prev_high":  round(float(prev["High"]),  2),
            "prev_low":   round(float(prev["Low"]),   2),
            "avg_volume": round(float(df["Volume"].mean()), 0),
        }

    if len(symbols) == 1:
        _extract(symbols[0], raw)
    else:
        for sym in symbols:
            try:
                _extract(sym, raw[sym])
            except Exception:
                pass

    _daily_context_cache = context
    _last_daily_fetch = now
    logger.info(f"Contexto diario listo para {len(context)} símbolos")
    return context


def fetch_detailed(symbols: list[str]) -> dict[str, pd.DataFrame]:
    """Descarga datos 1m para los símbolos más activos."""
    if not symbols:
        return {}
    return fetch_all_stocks(symbols=symbols, interval="1m")


def get_quote_snapshot(symbols: list[str], daily_context: dict[str, dict] = None) -> list[dict]:
    """
    Construye snapshots de precio con contexto diario incluido.
    """
    data = fetch_all_stocks(symbols=symbols, interval="5m")
    if daily_context is None:
        daily_context = _daily_context_cache

    snapshots = []

    for sym in symbols:
        df = data.get(sym)
        if df is None or df.empty:
            continue

        try:
            last       = df.iloc[-1]
            open_price = float(df.iloc[0]["Open"])
            current    = float(last["Close"])
            high       = float(df["High"].max())
            low        = float(df["Low"].min())
            volume     = int(df["Volume"].sum())

            ctx = daily_context.get(sym, {})
            prev_close  = ctx.get("prev_close")
            prev_high   = ctx.get("prev_high")
            prev_low    = ctx.get("prev_low")
            avg_volume  = ctx.get("avg_volume") or 1_000_000

            change_dollar = current - open_price
            change_pct    = (change_dollar / open_price * 100) if open_price > 0 else 0.0
            vol_relative  = volume / avg_volume if avg_volume > 0 else 1.0

            gap_pct = None
            if prev_close and prev_close > 0:
                gap_pct = round((open_price - prev_close) / prev_close * 100, 2)

            dollar_volume = round(current * volume, 0)

            snapshots.append({
                "symbol":       sym,
                "name":         get_company_name(sym),
                "price":        round(current, 2),
                "open":         round(open_price, 2),
                "high":         round(high, 2),
                "low":          round(low, 2),
                "change_pct":   round(change_pct, 2),
                "change_dollar":round(change_dollar, 2),
                "volume":       volume,
                "volume_relative": round(vol_relative, 2),
                "dollar_volume":dollar_volume,
                "prev_close":   prev_close,
                "prev_high":    prev_high,
                "prev_low":     prev_low,
                "gap_pct":      gap_pct,
                "df":           df,
            })
        except Exception as e:
            logger.debug(f"Error procesando snapshot {sym}: {e}")

    return snapshots


def get_last_fetch_time() -> Optional[datetime]:
    return _last_fetch
