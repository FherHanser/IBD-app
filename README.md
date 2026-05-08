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
- Asigna un **puntaje de 0–100** a cada acción según condiciones técnicas
- Clasifica las acciones en categorías y genera alertas
- Transmite el estado por **WebSocket** al frontend en tiempo real

### Frontend (React / TypeScript)
- Recibe datos en tiempo real y renderiza sin recargar la página
- Muestra semáforo 🟢🟡🔴 de confluencia técnica (Fibonacci 61.8% + Z-Score)
- Modal de detalle con análisis completo al hacer clic en cualquier acción

### Persistencia (Supabase / PostgreSQL)
- Guarda cada oportunidad detectada con precio de entrada y puntaje
- 24h después cierra la alerta con el precio actual y calcula el retorno
- Acumula **historial de efectividad** por categoría de precio

---

## Qué informa

| Sección | Contenido |
|---|---|
| **Movimiento del día** | Top 10 ganadoras y perdedoras por % de cambio con volumen |
| **Tentación de Compra** | Oportunidades por rango de precio: bajo (<$10), medio ($10–$50), alto (>$50) |
| **Alertas Activas** | Mejores oportunidades ordenadas por puntaje + movimientos extremos del día |
| **Modal de detalle** | Puntaje, señal, niveles de trade (entrada / stop / objetivo), Fibonacci, historial de señal |

---

## De dónde obtiene los datos

- **Yahoo Finance** (yfinance) — precios, volumen, historial de velas
- Datos con **15 minutos de retraso** (nivel gratuito)
- Intervalos: `5m` para el universo completo, `1m` para los 30 mayores movimientos
- Contexto diario (cierre anterior, máximo/mínimo, volumen promedio) con caché de 30 min

---

## Propuesta de valor

**Problema:** Un trader no puede monitorear 142 acciones manualmente y detectar setups técnicos en tiempo real.

**Solución:** El sistema hace el screening automático y presenta solo lo accionable — las acciones con confluencia técnica real (volumen, tendencia, nivel de precio, momentum) ordenadas por probabilidad de éxito según puntaje.

El historial de efectividad convierte el sistema en algo que se **valida solo con el tiempo**: no es opinión, es estadística real de cuántas señales resultaron en +1% en 24 horas.

---

## Tecnologías

| Capa | Tecnología |
|---|---|
| Backend | Python · FastAPI · APScheduler · asyncpg |
| Frontend | React · TypeScript · Tailwind CSS · Vite |
| Base de datos | Supabase (PostgreSQL) |
| Despliegue | Render (backend) · Vercel (frontend) |
| Datos | Yahoo Finance (yfinance) |

---

> No es asesoramiento financiero. Úsalo con criterio propio.
