"""
Generador de señales, alertas, niveles de trade y sesión de mercado.
"""

from datetime import datetime
import pytz

# Historial de señales activas: { symbol: { score, price, timestamp } }
_signal_history: dict[str, dict] = {}


def generate_signal(snapshot: dict, indicators: dict, scoring: dict) -> dict:
    """Genera la señal textual principal para una acción."""
    change_pct   = snapshot.get("change_pct", 0)
    vol_relative = snapshot.get("volume_relative", 1.0) or 1.0
    rsi          = indicators.get("rsi")
    above_vwap   = indicators.get("above_vwap")
    new_lows     = indicators.get("making_new_lows", False)
    ema_trend    = indicators.get("ema_trend", "neutral")
    score        = scoring.get("score", 0)
    atr_ratio    = indicators.get("atr_ratio") or 1.0

    if change_pct < -15:
        return {"type": "danger", "text": "Caída extrema. Evitar entrada hasta nueva confirmación."}

    if change_pct < -10 and new_lows:
        return {"type": "danger", "text": "Caída fuerte haciendo mínimos nuevos. Alto riesgo. Esperar estabilización."}

    if atr_ratio and atr_ratio > 1.8:
        return {"type": "caution", "text": f"Movimiento extendido ({atr_ratio:.1f}× ATR). Riesgo de reversión."}

    if change_pct > 8 and rsi and rsi > 70:
        return {"type": "caution", "text": "Subida extendida. No perseguir precio. Esperar retroceso."}

    if change_pct > 5 and vol_relative < 1.2:
        return {"type": "caution", "text": "Sube con volumen bajo. Posible trampa. Vigilar volumen."}

    if score >= 70:
        vwap_txt = "Recuperó VWAP. " if above_vwap else ""
        return {"type": "buy_watch", "text": f"{vwap_txt}Señal interesante. Revisar con riesgo controlado."}

    if score >= 50:
        if above_vwap:
            return {"type": "buy_watch", "text": "Precio sobre VWAP con volumen. Vigilar continuación."}
        return {"type": "buy_watch", "text": "Condiciones técnicas favorables. Esperar confirmación."}

    if change_pct < -5 and not new_lows and vol_relative > 1.5:
        return {"type": "caution", "text": "Caída con volumen. Vigilar estabilización antes de entrar."}

    if new_lows:
        return {"type": "caution", "text": "Haciendo mínimos nuevos. No entrar todavía."}

    if ema_trend in ("alcista", "alcista_parcial") and change_pct > 0:
        return {"type": "info", "text": "Tendencia alcista activa."}

    return {"type": "info", "text": "Sin señal clara. Monitorear."}


def calculate_trade_levels(price: float, indicators: dict, signal_type: str) -> dict | None:
    """
    Calcula niveles de entrada, stop y objetivos basados en ATR.
    Solo para señales de tipo buy_watch.
    """
    atr = indicators.get("atr")
    if not atr or atr <= 0 or price <= 0:
        return None

    if signal_type == "buy_watch":
        stop     = round(price - 1.0 * atr, 2)
        target1  = round(price + 1.5 * atr, 2)
        target2  = round(price + 3.0 * atr, 2)
        risk     = price - stop
        rr1      = round((target1 - price) / risk, 1) if risk > 0 else 0
        rr2      = round((target2 - price) / risk, 1) if risk > 0 else 0
        return {
            "entry":        round(price, 2),
            "stop":         stop,
            "target1":      target1,
            "target2":      target2,
            "risk_dollar":  round(risk, 2),
            "risk_pct":     round(risk / price * 100, 2),
            "rr1":          rr1,
            "rr2":          rr2,
            "direction":    "long",
        }

    return None


def track_signal(symbol: str, score: int, price: float, signal_type: str):
    """Registra cuándo apareció una señal y a qué precio."""
    if score < 50 or signal_type not in ("buy_watch",):
        _signal_history.pop(symbol, None)
        return

    if symbol not in _signal_history:
        _signal_history[symbol] = {
            "score":      score,
            "price":      price,
            "timestamp":  datetime.utcnow().isoformat() + "Z",
        }


def get_signal_age(symbol: str, current_price: float) -> dict | None:
    """Retorna cuánto tiempo lleva activa la señal y cuánto se movió el precio."""
    entry = _signal_history.get(symbol)
    if not entry:
        return None

    try:
        ts = datetime.fromisoformat(entry["timestamp"].replace("Z", "+00:00"))
        now = datetime.now(tz=ts.tzinfo)
        minutes = int((now - ts).total_seconds() / 60)
        signal_price = entry["price"]
        move_pct = round((current_price - signal_price) / signal_price * 100, 2) if signal_price > 0 else 0
        return {
            "minutes_ago":    minutes,
            "signal_price":   signal_price,
            "move_since_pct": move_pct,
        }
    except Exception:
        return None


def generate_alerts(entries: list[dict]) -> list[dict]:
    """Genera lista de alertas basada en los entries procesados."""
    alerts = []
    now = datetime.now(pytz.timezone("America/New_York")).isoformat()

    for e in entries:
        change   = e.get("change_pct", 0)
        vol_rel  = e.get("volume_relative", 1.0) or 1.0
        score    = e.get("score", 0)
        sym      = e.get("symbol", "")
        price    = e.get("price", 0)
        rsi      = e.get("rsi")
        sig_type = e.get("signal_type", "info")
        setup    = e.get("setup_label", "")
        rs_spy   = e.get("rs_spy")

        if change > 5 and vol_rel > 2:
            alerts.append({
                "symbol": sym, "price": price,
                "type": "gainer_alert",
                "severity": "high" if change > 8 else "medium",
                "message": f"{sym} sube {change:.1f}% con volumen {vol_rel:.1f}×. Riesgo de entrada tardía.",
                "timestamp": now,
            })
        elif change < -8 and vol_rel > 1.5:
            alerts.append({
                "symbol": sym, "price": price,
                "type": "loser_alert",
                "severity": "high" if change < -12 else "medium",
                "message": f"{sym} cae {change:.1f}% con volumen {vol_rel:.1f}×. Esperar estabilización.",
                "timestamp": now,
            })
        elif score >= 65 and sig_type == "buy_watch":
            rs_txt = f" RS vs SPY: {rs_spy:+.1f}%." if rs_spy is not None else ""
            rsi_txt = f" RSI {rsi:.0f}." if rsi else ""
            setup_txt = f" Setup: {setup}." if setup else ""
            alerts.append({
                "symbol": sym, "price": price,
                "type": "opportunity_alert",
                "severity": "high" if score >= 75 else "medium",
                "message": f"{sym} score {score}.{rsi_txt}{rs_txt}{setup_txt}",
                "timestamp": now,
            })

    severity_order = {"high": 0, "medium": 1, "low": 2}
    alerts.sort(key=lambda a: severity_order.get(a["severity"], 2))
    return alerts[:20]


def get_market_session() -> dict:
    """Determina la sesión de mercado actual."""
    et  = pytz.timezone("America/New_York")
    now = datetime.now(et)
    hour = now.hour + now.minute / 60

    if now.weekday() >= 5:
        return {"session": "closed", "label": "Fin de Semana", "is_active": False,
                "time_et": now.strftime("%H:%M:%S ET"), "date": now.strftime("%Y-%m-%d")}

    if 4.0 <= hour < 9.5:
        session, label, active = "pre_market",  "Pre-Market",       True
    elif 9.5 <= hour < 16.0:
        session, label, active = "market",      "Mercado Abierto",  True
    elif 16.0 <= hour < 20.0:
        session, label, active = "after_hours", "After Hours",      True
    else:
        session, label, active = "closed",      "Mercado Cerrado",  False

    return {
        "session":   session,
        "label":     label,
        "is_active": active,
        "time_et":   now.strftime("%H:%M:%S ET"),
        "date":      now.strftime("%Y-%m-%d"),
    }
