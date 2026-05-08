# CNTNL - VALUE · Sistema de Monitoreo Intradía

> Screening técnico automatizado del mercado americano. Tiempo real. Sin ruido.

---

## Qué hace

Monitorea **142 acciones del mercado americano** en tiempo real, las clasifica automáticamente por comportamiento técnico y genera alertas de oportunidad. Todo actualizado cada 60 segundos.

---

## Cómo funciona

### Backend (Python / FastAPI)
- Cada 60s descarga precios, volumen y datos técnicos de todos los símbolos vía **Yahoo Finance**
- Calcula indicadores: RSI, EMA20, VWAP, ATR, Z-Score, Fibonacci, RS vs SPY
- Asigna un **score de 0–100** a cada acción según condiciones técnicas
- Clasifica las acciones en buckets y genera alertas
- Transmite el estado via **WebSocket** al frontend en tiempo real

### Frontend (React / TypeScript)
- Recibe datos en tiempo real y renderiza sin recargar página
- Muestra semáforo 🟢🟡🔴 de confluencia técnica (Fibonacci 61.8% + Z-Score)
- Modal de detalle con análisis completo al hacer clic en cualquier acción

### Persistencia (Supabase / PostgreSQL)
- Guarda cada oportunidad detectada con precio de entrada y score
- 24h después cierra la alerta con el precio actual y calcula el retorno
- Acumula **win rate histórico** por bucket de precio

---

## Qué informa

| Sección | Contenido |
|---|---|
| **Movimiento del día** | Top 10 ganadoras y perdedoras por % de cambio con volumen |
| **Tentación de Compra** | Oportunidades segmentadas por precio: bajo (<$10), medio ($10–$50), top (>$50) |
| **Alertas Activas** | Mejores oportunidades ordenadas por score + movimientos extremos del día |
| **Modal de detalle** | Score, señal, niveles de trade (entrada / stop / target), Fibonacci, historial de señal |

---

## De dónde obtiene los datos

- **Yahoo Finance** (yfinance) — precios, volumen, historial de velas
- Datos con **15 minutos de delay** (tier gratuito)
- Intervalos: `5m` para el universo completo, `1m` para los top 30 movers
- Contexto diario (prev close, high/low, avg volume) cacheado 30 min

---

## Propuesta de valor

**Problema:** Un trader retail no puede monitorear 142 acciones manualmente y detectar setups técnicos en tiempo real.

**Solución:** El sistema hace el screening automático y presenta solo lo accionable — las acciones con confluencia técnica real (volumen, tendencia, nivel de precio, momentum) ordenadas por probabilidad de éxito según score.

El win rate histórico convierte el sistema en algo que se **valida solo con el tiempo**: no es opinión, es estadística real de cuántas de sus señales resultaron en +1% en 24h.

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Python · FastAPI · APScheduler · asyncpg |
| Frontend | React · TypeScript · Tailwind CSS · Vite |
| Base de datos | Supabase (PostgreSQL) |
| Deploy | Render (backend) · Vercel (frontend) |
| Datos | Yahoo Finance (yfinance) |

---

> No es asesoramiento financiero. Úsalo con criterio propio.
