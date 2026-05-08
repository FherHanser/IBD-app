"""
Motor de scoring de oportunidad 0-100.

Componentes:
  tendencia_general  20%  - EMAs alineadas al alza
  retroceso_sano     20%  - Caída entre 3% y 15%
  volumen_comprador  20%  - Volumen relativo > 1.5
  rsi_zona           15%  - RSI entre 30 y 50
  recuperacion_vwap  15%  - Precio cerca o sobre VWAP
  riesgo_caida       10%  - Penaliza caídas extremas (>15%)
"""


SCORE_BANDS = [
    (0, 30,  "Sin señal",       "⚫"),
    (31, 50, "Vigilar",         "🟡"),
    (51, 70, "Interesante",     "🟢"),
    (71, 85, "Alta oportunidad","🟢"),
    (86, 100,"Señal fuerte",    "🟢"),
]


def calculate_opportunity_score(snapshot: dict, indicators: dict) -> dict:
    """
    Calcula el score de oportunidad de compra (0-100).
    Devuelve el score, la banda y la razón textual.
    """
    change_pct = snapshot.get("change_pct", 0.0)
    vol_relative = snapshot.get("volume_relative", 1.0) or 1.0

    rsi = indicators.get("rsi")
    vwap = indicators.get("vwap")
    price = indicators.get("price") or snapshot.get("price", 0)
    ema_trend = indicators.get("ema_trend", "neutral")
    above_vwap = indicators.get("above_vwap")
    making_new_lows = indicators.get("making_new_lows", False)

    reasons = []
    score = 0.0

    # --- 1. Tendencia general (20 puntos) ---
    trend_score = 0
    if ema_trend == "alcista":
        trend_score = 20
        reasons.append("tendencia alcista confirmada")
    elif ema_trend == "alcista_parcial":
        trend_score = 12
        reasons.append("tendencia alcista parcial")
    elif ema_trend == "neutral":
        trend_score = 8
    else:
        trend_score = 2
    score += trend_score

    # --- 2. Retroceso saludable (20 puntos) ---
    # Óptimo: caída entre 3% y 12% desde apertura
    retrace_score = 0
    if -12 <= change_pct <= -3:
        retrace_score = 20
        reasons.append(f"retroceso saludable ({change_pct:.1f}%)")
    elif -15 <= change_pct < -12:
        retrace_score = 10
        reasons.append(f"retroceso fuerte ({change_pct:.1f}%)")
    elif -3 < change_pct <= 0:
        retrace_score = 8
    elif 0 < change_pct <= 3:
        retrace_score = 5
    # cambios negativos > 15% o positivos > 3% no suman aquí
    score += retrace_score

    # --- 3. Volumen comprador (20 puntos) ---
    vol_score = 0
    if vol_relative >= 2.5:
        vol_score = 20
        reasons.append("volumen muy alto")
    elif vol_relative >= 1.5:
        vol_score = 15
        reasons.append("volumen elevado")
    elif vol_relative >= 1.0:
        vol_score = 8
    else:
        vol_score = 3
    score += vol_score

    # --- 4. RSI zona (15 puntos) ---
    rsi_score = 0
    if rsi is not None:
        if 30 <= rsi <= 45:
            rsi_score = 15
            reasons.append(f"RSI en sobreventa moderada ({rsi:.0f})")
        elif 45 < rsi <= 55:
            rsi_score = 10
        elif rsi < 30:
            rsi_score = 12
            reasons.append(f"RSI en sobreventa fuerte ({rsi:.0f})")
        elif 55 < rsi <= 70:
            rsi_score = 5
        else:
            rsi_score = 0  # RSI > 70: sobrecomprado
    score += rsi_score

    # --- 5. Recuperación VWAP (15 puntos) ---
    vwap_score = 0
    if vwap and price:
        pct_from_vwap = (price - vwap) / vwap * 100
        if -1 <= pct_from_vwap <= 1:
            vwap_score = 15
            reasons.append("precio cerca de VWAP")
        elif -3 <= pct_from_vwap < -1:
            vwap_score = 10
            reasons.append("precio bajo VWAP, acercándose")
        elif 1 < pct_from_vwap <= 3:
            vwap_score = 10
            reasons.append("precio sobre VWAP")
        elif pct_from_vwap > 3:
            vwap_score = 4
        else:
            vwap_score = 4
    score += vwap_score

    # --- 6. Riesgo de caída (10 puntos — penalización) ---
    risk_score = 10
    if change_pct < -15:
        risk_score = 0
        reasons.append("caída extrema, riesgo muy alto")
    elif change_pct < -12:
        risk_score = 3
    elif making_new_lows:
        risk_score = 4
        reasons.append("haciendo mínimos nuevos")
    score += risk_score

    # Clamp 0-100
    score = max(0, min(100, round(score)))

    band_label, band_icon = _get_band(score)
    risk_level = _classify_risk(change_pct, vol_relative, making_new_lows)

    return {
        "score": score,
        "band": band_label,
        "band_icon": band_icon,
        "risk": risk_level,
        "reasons": reasons,
    }


def _get_band(score: int) -> tuple[str, str]:
    for lo, hi, label, icon in SCORE_BANDS:
        if lo <= score <= hi:
            return label, icon
    return "Sin señal", "⚫"


def _classify_risk(change_pct: float, vol_relative: float, making_new_lows: bool) -> str:
    if change_pct < -15 or (change_pct < -10 and making_new_lows):
        return "alto"
    if change_pct < -8 or vol_relative > 3:
        return "medio-alto"
    if change_pct < -3:
        return "medio"
    return "bajo"
