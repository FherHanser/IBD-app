"""
Cálculo de indicadores técnicos con pandas-ta.
"""

import logging
import numpy as np
import pandas as pd
import pandas_ta as ta

logger = logging.getLogger(__name__)


def calculate_indicators(df: pd.DataFrame, snapshot: dict = None) -> dict:
    """Calcula todos los indicadores técnicos relevantes."""
    if df is None or len(df) < 5:
        return _empty_indicators()

    df = df.copy()
    df.columns = [c.capitalize() for c in df.columns]

    try:
        result = {}

        # --- Precio y referencias básicas ---
        result["price"]    = round(float(df["Close"].iloc[-1]), 2)
        result["day_high"] = round(float(df["High"].max()), 2)
        result["day_low"]  = round(float(df["Low"].min()), 2)
        result["open"]     = round(float(df["Open"].iloc[0]), 2)

        # --- Gap desde cierre anterior ---
        if snapshot:
            result["gap_pct"]    = snapshot.get("gap_pct")
            result["prev_close"] = snapshot.get("prev_close")
            result["prev_high"]  = snapshot.get("prev_high")
            result["prev_low"]   = snapshot.get("prev_low")
        else:
            result["gap_pct"] = result["prev_close"] = result["prev_high"] = result["prev_low"] = None

        # --- RSI 14 ---
        rsi_s = ta.rsi(df["Close"], length=14)
        result["rsi"] = _last(rsi_s)

        # --- EMAs ---
        result["ema9"]  = _last(ta.ema(df["Close"], length=9))
        result["ema20"] = _last(ta.ema(df["Close"], length=20))
        result["ema50"] = _last(ta.ema(df["Close"], length=min(50, len(df) - 1)))

        # --- MACD ---
        if len(df) >= 26:
            macd_df = ta.macd(df["Close"])
            if macd_df is not None and not macd_df.empty:
                cols = macd_df.columns.tolist()
                result["macd_line"]   = _last(macd_df[cols[0]])
                result["macd_signal"] = _last(macd_df[cols[2]])
                result["macd_hist"]   = _last(macd_df[cols[1]])
            else:
                result["macd_line"] = result["macd_signal"] = result["macd_hist"] = None
        else:
            result["macd_line"] = result["macd_signal"] = result["macd_hist"] = None

        # --- VWAP con bandas de desviación estándar ---
        if "Volume" in df.columns and df["Volume"].sum() > 0:
            vwap_vals = _calc_vwap_bands(df)
            result.update(vwap_vals)
        else:
            result.update(_empty_vwap())

        # --- ATR 14 ---
        atr_s = None
        if len(df) >= 14:
            atr_s = ta.atr(df["High"], df["Low"], df["Close"], length=14)
            result["atr"] = _last(atr_s)
        else:
            result["atr"] = None

        # --- Rango actual vs ATR ---
        day_range = result["day_high"] - result["day_low"]
        if result["atr"] and result["atr"] > 0:
            result["atr_ratio"] = round(day_range / result["atr"], 2)
        else:
            result["atr_ratio"] = None

        # --- Rango intradía % ---
        if result["open"] > 0:
            result["range_pct"] = round(day_range / result["open"] * 100, 2)
        else:
            result["range_pct"] = None

        # --- Volumen relativo (vs media 20 períodos) ---
        if "Volume" in df.columns and len(df) >= 5:
            vol_avg = df["Volume"].rolling(min(20, len(df))).mean().iloc[-1]
            vol_now = df["Volume"].iloc[-1]
            result["volume_relative"] = round(vol_now / vol_avg, 2) if vol_avg > 0 else 1.0
        else:
            result["volume_relative"] = 1.0

        # --- ¿Hace nuevos mínimos? ---
        result["making_new_lows"] = _is_making_new_lows(df)

        # --- Relación precio / VWAP ---
        vwap = result.get("vwap")
        price = result["price"]
        if vwap:
            result["above_vwap"]   = price > vwap
            result["pct_from_vwap"] = round((price - vwap) / vwap * 100, 2)
        else:
            result["above_vwap"]   = None
            result["pct_from_vwap"] = None

        # --- Tendencia EMA ---
        result["ema_trend"] = _classify_ema_trend(result)

        return result

    except Exception as e:
        logger.debug(f"Error calculando indicadores: {e}")
        return _empty_indicators()


def _calc_vwap_bands(df: pd.DataFrame) -> dict:
    """Calcula VWAP con bandas ±1σ y ±2σ."""
    try:
        tp = (df["High"] + df["Low"] + df["Close"]) / 3
        vol = df["Volume"].replace(0, np.nan).fillna(1)

        cum_vol    = vol.cumsum()
        cum_tp_vol = (tp * vol).cumsum()
        vwap       = cum_tp_vol / cum_vol

        cum_tp2_vol = (tp ** 2 * vol).cumsum()
        variance    = (cum_tp2_vol / cum_vol) - vwap ** 2
        std         = np.sqrt(variance.clip(lower=0))

        return {
            "vwap":         round(float(vwap.iloc[-1]), 2),
            "vwap_upper1":  round(float((vwap + 1 * std).iloc[-1]), 2),
            "vwap_lower1":  round(float((vwap - 1 * std).iloc[-1]), 2),
            "vwap_upper2":  round(float((vwap + 2 * std).iloc[-1]), 2),
            "vwap_lower2":  round(float((vwap - 2 * std).iloc[-1]), 2),
        }
    except Exception:
        return _empty_vwap()


def _last(series) -> float | None:
    if series is None or len(series) == 0:
        return None
    val = series.dropna()
    if val.empty:
        return None
    return round(float(val.iloc[-1]), 4)


def _is_making_new_lows(df: pd.DataFrame) -> bool:
    if len(df) < 3:
        return False
    recent = df["Close"].tail(5)
    return float(recent.iloc[-1]) == float(recent.min())


def _classify_ema_trend(ind: dict) -> str:
    e9, e20, e50 = ind.get("ema9"), ind.get("ema20"), ind.get("ema50")
    if e9 and e20 and e50:
        if e9 > e20 > e50:   return "alcista"
        if e9 < e20 < e50:   return "bajista"
    if e9 and e20:
        if e9 > e20:         return "alcista_parcial"
        else:                return "bajista_parcial"
    return "neutral"


def _empty_vwap() -> dict:
    return {
        "vwap": None, "vwap_upper1": None, "vwap_lower1": None,
        "vwap_upper2": None, "vwap_lower2": None,
    }


def _empty_indicators() -> dict:
    base = {
        "rsi": None, "ema9": None, "ema20": None, "ema50": None,
        "macd_line": None, "macd_signal": None, "macd_hist": None,
        "atr": None, "atr_ratio": None, "range_pct": None,
        "volume_relative": None, "price": None,
        "day_high": None, "day_low": None, "open": None,
        "making_new_lows": False, "above_vwap": None, "pct_from_vwap": None,
        "ema_trend": "neutral",
        "gap_pct": None, "prev_close": None, "prev_high": None, "prev_low": None,
    }
    base.update(_empty_vwap())
    return base
