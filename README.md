# CNTNL - VALUE · Sistema de Monitoreo Intradía

> Screening técnico automatizado del mercado americano. Tiempo real. Sin ruido.

---

## Qué hace

Monitorea **142 acciones del mercado americano** en tiempo real, las clasifica automáticamente por comportamiento técnico y genera alertas de oportunidad. Todo actualizado cada 60 segundos.

---

## Cómo funciona

### Backend (Python / FastAPI)
- Cada 60s descarga precios, volumen y datos técnicos de todos los símbolos vía **Yahoo Finance**
- Calcula indicadores: RSI, EMA20, VWAP, ATR, Z-Score, RS vs SPY
- Calcula niveles de **Fibonacci** (23.6%, 38.2%, 50%, 61.8%, 78.6%) sobre el rango del día
- Detecta confluencia en el nivel dorado 61.8% combinado con Z-Score para identificar zonas óptimas de compra
- Asigna un **puntaje de 0–100** a cada acción según condiciones técnicas
- Clasifica las acciones en categorías y genera alertas
- Transmite el estado por **WebSocket** al frontend en tiempo real

### Frontend (React / TypeScript)
- Recibe datos en tiempo real y renderiza sin recargar la página
- Muestra semáforo 🟢🟡🔴 de confluencia técnica directamente en cada tarjeta:
  - 🟢 **Compra óptima** — precio en Fibonacci 61.8% ± 2% y Z-Score normalizado
  - 🟡 **Preparar** — precio acercándose al nivel dorado (± 5%)
  - 🔴 **Extendido** — precio muy alejado de su media (Z-Score > 1.5)
- Cuando se cumple la confluencia perfecta, el modal de detalle despliega el banner **⭐ COMPRA ÓPTIMA** — el nivel de precio más favorable según el análisis técnico combinado
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
| **Modal de detalle** | Puntaje, señal, niveles de trade (entrada / stop / objetivo), análisis completo de Fibonacci con interpretación de cada nivel, historial de señal |

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

**El nivel dorado:** Cuando el precio de una acción coincide con el retroceso de Fibonacci 61.8% del rango del día y el Z-Score indica que no está sobreextendido, el sistema activa el banner **⭐ COMPRA ÓPTIMA** — la confluencia más precisa entre precio justo y momentum controlado.

**Semáforo de entrada:** Cada tarjeta de oportunidad muestra 🟢🟡🔴 para que de un vistazo sepas si el momento de entrada es óptimo, se está acercando, o el precio ya corrió demasiado.

**Validación con datos reales:** El historial de efectividad convierte el sistema en algo que se valida solo con el tiempo — no es opinión, es estadística real de cuántas señales resultaron en +1% en 24 horas.

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
