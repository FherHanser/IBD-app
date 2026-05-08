"""
Genera los Top 10 de ganadoras, perdedoras y oportunidades.
"""

import logging
from config import TOP_N

ETF_SYMBOLS = {
    "SPY", "QQQ", "IWM", "DIA", "GLD", "SLV", "TLT", "XLF", "XLE",
    "XLK", "XLV", "XLI", "XLB", "XLU", "XLRE", "XLC", "XLY", "XLP",
    "VTI", "VOO", "VEA", "VWO", "AGG", "BND", "HYG", "LQD",
}

from analysis.indicators import calculate_indicators
from analysis.scoring import calculate_opportunity_score
from analysis.signals import generate_signal, calculate_trade_levels, track_signal, get_signal_age
from analysis.setup_classifier import classify_setup

logger = logging.getLogger(__name__)


def build_stock_entry(snapshot: dict, spy_change: float = 0.0, qqq_change: float = 0.0) -> dict:
    """Construye la entrada completa de una acción con indicadores, score y señal."""
    df = snapshot.get("df")
    indicators = calculate_indicators(df, snapshot) if df is not None else {}

    scoring = calculate_opportunity_score(snapshot, indicators)
    signal = generate_signal(snapshot, indicators, scoring)
    setup = classify_setup(snapshot, indicators)

    symbol = snapshot["symbol"]
    price = snapshot["price"]
    score = scoring["score"]
    signal_type = signal["type"]
    change_pct = snapshot.get("change_pct", 0)

    trade_levels = calculate_trade_levels(price, indicators, signal_type)
    track_signal(symbol, score, price, signal_type)
    signal_age = get_signal_age(symbol, price)

    rs_spy = round(change_pct - spy_change, 2) if spy_change is not None else None
    rs_qqq = round(change_pct - qqq_change, 2) if qqq_change is not None else None

    return {
        "symbol": symbol,
        "name": snapshot["name"],
        "price": price,
        "open": snapshot["open"],
        "high": snapshot["high"],
        "low": snapshot["low"],
        "change_pct": change_pct,
        "change_dollar": snapshot["change_dollar"],
        "volume": snapshot["volume"],
        "volume_relative": snapshot["volume_relative"],
        "dollar_volume": snapshot.get("dollar_volume"),
        # Contexto diario
        "gap_pct": snapshot.get("gap_pct"),
        "prev_close": snapshot.get("prev_close"),
        "prev_high": snapshot.get("prev_high"),
        "prev_low": snapshot.get("prev_low"),
        # Indicadores clave
        "rsi": indicators.get("rsi"),
        "vwap": indicators.get("vwap"),
        "vwap_upper1": indicators.get("vwap_upper1"),
        "vwap_lower1": indicators.get("vwap_lower1"),
        "vwap_upper2": indicators.get("vwap_upper2"),
        "vwap_lower2": indicators.get("vwap_lower2"),
        "ema9": indicators.get("ema9"),
        "ema20": indicators.get("ema20"),
        "ema_trend": indicators.get("ema_trend", "neutral"),
        "macd_hist": indicators.get("macd_hist"),
        "above_vwap": indicators.get("above_vwap"),
        "pct_from_vwap": indicators.get("pct_from_vwap"),
        "making_new_lows": indicators.get("making_new_lows", False),
        "atr": indicators.get("atr"),
        "atr_ratio": indicators.get("atr_ratio"),
        "range_pct": indicators.get("range_pct"),
        # Score y clasificación
        "score": score,
        "score_band": scoring["band"],
        "score_icon": scoring["band_icon"],
        "risk": scoring["risk"],
        "score_reasons": scoring["reasons"],
        # Señal textual
        "signal": signal["text"],
        "signal_type": signal_type,
        # Setup técnico
        "setup_key": setup["key"],
        "setup_label": setup["label"],
        "setup_confidence": setup["confidence"],
        "setup_reason": setup["reason"],
        # Niveles de trade
        "trade_levels": trade_levels,
        # Edad de la señal
        "signal_age": signal_age,
        # Fuerza relativa vs mercado
        "rs_spy": rs_spy,
        "rs_qqq": rs_qqq,
    }


def compute_rankings(snapshots: list[dict], top_n: int = TOP_N) -> dict:
    """
    Toma los snapshots crudos y calcula los tres rankings.
    Retorna: { gainers, losers, opportunities, total_processed }
    """
    if not snapshots:
        return {"gainers": [], "losers": [], "opportunities": [], "total_processed": 0}

    spy_change = next((s["change_pct"] for s in snapshots if s["symbol"] == "SPY"), 0.0)
    qqq_change = next((s["change_pct"] for s in snapshots if s["symbol"] == "QQQ"), 0.0)

    valid = [s for s in snapshots if s.get("volume", 0) > 50_000]
    logger.info(f"Calculando rankings para {len(valid)} acciones válidas...")

    entries = []
    for snap in valid:
        try:
            entry = build_stock_entry(snap, spy_change, qqq_change)
            entries.append(entry)
        except Exception as e:
            logger.debug(f"Error procesando {snap.get('symbol')}: {e}")

    gainers = sorted(
        [e for e in entries if e["change_pct"] > 0],
        key=lambda x: x["change_pct"],
        reverse=True,
    )[:top_n]

    losers = sorted(
        [e for e in entries if e["change_pct"] < 0],
        key=lambda x: x["change_pct"],
    )[:top_n]

    opp_base = [
        e for e in entries
        if e["score"] >= 35
        and e["change_pct"] <= 5
        and e["volume_relative"] >= 1.0
        and e["symbol"] not in ETF_SYMBOLS
    ]

    opp_low = sorted(
        [e for e in opp_base if 1.0 <= e["price"] <= 10.0],
        key=lambda x: x["score"], reverse=True,
    )[:5]

    opp_mid = sorted(
        [e for e in opp_base if 10.0 < e["price"] <= 20.0],
        key=lambda x: x["score"], reverse=True,
    )[:5]

    opp_top = sorted(
        opp_base,
        key=lambda x: x["score"], reverse=True,
    )[:5]

    return {
        "gainers": gainers,
        "losers": losers,
        "opp_low": opp_low,
        "opp_mid": opp_mid,
        "opp_top": opp_top,
        "total_processed": len(entries),
    }
