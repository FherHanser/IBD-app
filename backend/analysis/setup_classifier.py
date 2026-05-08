"""
Clasificador de setups técnicos.
Determina qué patrón está mostrando la acción basado en indicadores.
"""


SETUP_TYPES = {
    "pullback_vwap":        "Pullback a VWAP",
    "breakout_high":        "Breakout high del día",
    "reversal_oversold":    "Reversión desde sobreventa",
    "gap_up_strong":        "Gap up con fuerza",
    "gap_down_support":     "Gap down buscando soporte",
    "short_squeeze":        "Short squeeze potencial",
    "continuation_bull":    "Continuación alcista",
    "continuation_bear":    "Caída con continuación",
    "vwap_reclaim":         "Recuperación de VWAP",
    "bull_trap":            "Trampa alcista probable",
    "extended_move":        "Movimiento extendido",
    "undefined":            "Sin patrón definido",
}


def classify_setup(snapshot: dict, indicators: dict) -> dict:
    """
    Clasifica el setup técnico de una acción.
    Retorna: { key, label, confidence }
    """
    price       = indicators.get("price", 0) or 0
    vwap        = indicators.get("vwap")
    rsi         = indicators.get("rsi")
    change_pct  = snapshot.get("change_pct", 0)
    vol_rel     = snapshot.get("volume_relative", 1.0) or 1.0
    ema_trend   = indicators.get("ema_trend", "neutral")
    new_lows    = indicators.get("making_new_lows", False)
    above_vwap  = indicators.get("above_vwap")
    macd_hist   = indicators.get("macd_hist")
    pct_vwap    = indicators.get("pct_from_vwap")
    day_high    = indicators.get("day_high", 0) or 0
    gap_pct     = indicators.get("gap_pct", 0) or 0
    atr_ratio   = indicators.get("atr_ratio", 1.0) or 1.0  # rango actual / ATR

    # --- Movimiento extendido (peligro en ambos sentidos) ---
    if atr_ratio > 1.5:
        return _make(
            "extended_move",
            "alta" if atr_ratio > 2 else "media",
            f"rango {atr_ratio:.1f}× su ATR normal",
        )

    # --- Breakout del high del día con volumen ---
    if day_high > 0 and price >= day_high * 0.998 and vol_rel >= 2.0 and change_pct > 2:
        return _make("breakout_high", "alta", "precio en máximo del día con volumen")

    # --- Gap up con fuerza (abre alto y mantiene) ---
    if gap_pct > 3 and change_pct > 0 and vol_rel >= 1.5:
        return _make("gap_up_strong", "alta", f"gap +{gap_pct:.1f}% con volumen {vol_rel:.1f}×")

    # --- Short squeeze potencial ---
    if change_pct > 6 and vol_rel >= 2.5 and ema_trend in ("bajista", "bajista_parcial"):
        return _make("short_squeeze", "media", "subida fuerte contra tendencia con volumen extremo")

    # --- Trampa alcista (sube sin volumen) ---
    if change_pct > 3 and vol_rel < 0.9:
        return _make("bull_trap", "media", "subida sin respaldo de volumen")

    # --- Recuperación de VWAP (rebote desde abajo) ---
    if pct_vwap is not None and -0.5 <= pct_vwap <= 0.5 and change_pct < 0 and vol_rel >= 1.3:
        return _make("vwap_reclaim", "alta", "precio volviendo a VWAP con volumen")

    # --- Pullback a VWAP (retroceso sano en tendencia alcista) ---
    if (
        pct_vwap is not None
        and -1.5 <= pct_vwap <= 0.5
        and ema_trend in ("alcista", "alcista_parcial")
        and -5 <= change_pct <= 0
    ):
        return _make("pullback_vwap", "alta", "retroceso sano a VWAP en tendencia alcista")

    # --- Reversión desde sobreventa ---
    if rsi is not None and rsi < 35 and macd_hist is not None and macd_hist > 0 and not new_lows:
        return _make("reversal_oversold", "alta", f"RSI {rsi:.0f} + MACD girando al alza")

    # --- Gap down buscando soporte ---
    if gap_pct < -3 and not new_lows and rsi is not None and rsi < 50:
        return _make("gap_down_support", "media", f"gap -{abs(gap_pct):.1f}% pero dejó de caer")

    # --- Continuación alcista ---
    if ema_trend == "alcista" and 0 < change_pct < 6 and above_vwap and vol_rel >= 1.2:
        return _make("continuation_bull", "media", "estructura alcista sana con volumen")

    # --- Caída con continuación bajista ---
    if new_lows and vol_rel >= 1.5 and change_pct < -5:
        return _make("continuation_bear", "alta", "haciendo mínimos nuevos con volumen")

    return _make("undefined", "baja", "")


def _make(key: str, confidence: str, reason: str) -> dict:
    return {
        "key": key,
        "label": SETUP_TYPES.get(key, "Sin patrón"),
        "confidence": confidence,
        "reason": reason,
    }
