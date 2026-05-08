"""
Persistencia en PostgreSQL (Supabase) para historial de alertas y win rate.
Si DATABASE_URL no está configurado, todas las funciones son no-ops silenciosos.
"""

import os
import logging
import asyncio

try:
    import asyncpg
except ImportError:
    asyncpg = None  # type: ignore

logger = logging.getLogger(__name__)

_pool: asyncpg.Pool | None = None


async def init_db():
    global _pool
    if asyncpg is None:
        logger.warning("asyncpg no disponible — win rate tracking deshabilitado")
        return
    url = os.environ.get("DATABASE_URL", "")
    if not url:
        logger.warning("DATABASE_URL no configurado — win rate tracking deshabilitado")
        return

    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    try:
        _pool = await asyncio.wait_for(
            asyncpg.create_pool(
                url, min_size=1, max_size=3,
                ssl=True if "supabase" in url else None,
            ),
            timeout=15,
        )
        await _create_tables()
        logger.info("Base de datos conectada correctamente")
    except asyncio.TimeoutError:
        logger.warning("DB connection timeout (15s) — win rate tracking deshabilitado")
        _pool = None
    except Exception as e:
        logger.error(f"Error conectando a DB: {e}")
        _pool = None


async def close_db():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


async def _create_tables():
    async with _pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS alert_history (
                id          SERIAL PRIMARY KEY,
                symbol      TEXT NOT NULL,
                entry_price FLOAT NOT NULL,
                score       INTEGER NOT NULL,
                signal_type TEXT,
                setup_key   TEXT,
                price_range TEXT,
                created_at  TIMESTAMPTZ DEFAULT NOW(),
                closed_price FLOAT,
                return_pct   FLOAT,
                closed_at    TIMESTAMPTZ
            );
            CREATE INDEX IF NOT EXISTS idx_alert_symbol_date
                ON alert_history (symbol, (created_at::date));
            CREATE INDEX IF NOT EXISTS idx_alert_closed
                ON alert_history (closed_at) WHERE closed_at IS NULL;
        """)


async def save_opportunity_alert(
    symbol: str, price: float, score: int,
    signal_type: str, setup_key: str, price_range: str
):
    """Guarda una alerta de oportunidad. Una por símbolo por día."""
    if not _pool:
        return
    try:
        async with _pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO alert_history
                    (symbol, entry_price, score, signal_type, setup_key, price_range)
                SELECT $1, $2, $3, $4, $5, $6
                WHERE NOT EXISTS (
                    SELECT 1 FROM alert_history
                    WHERE symbol = $1
                    AND created_at::date = CURRENT_DATE
                )
            """, symbol, price, score, signal_type, setup_key, price_range)
    except Exception as e:
        logger.error(f"Error guardando alerta {symbol}: {e}")


async def close_old_alerts(price_map: dict[str, float]):
    """Cierra alertas con más de 24h usando precios actuales del mercado."""
    if not _pool:
        return
    try:
        async with _pool.acquire() as conn:
            old = await conn.fetch("""
                SELECT id, symbol, entry_price FROM alert_history
                WHERE closed_at IS NULL
                AND created_at < NOW() - INTERVAL '24 hours'
            """)
            for row in old:
                current = price_map.get(row["symbol"])
                if current and current > 0:
                    ret = round((current - row["entry_price"]) / row["entry_price"] * 100, 2)
                    await conn.execute("""
                        UPDATE alert_history
                        SET closed_price = $1, return_pct = $2, closed_at = NOW()
                        WHERE id = $3
                    """, current, ret, row["id"])
    except Exception as e:
        logger.error(f"Error cerrando alertas: {e}")


async def get_win_stats() -> dict:
    """
    Retorna estadísticas de win rate por bucket de precio,
    basadas en alertas cerradas en los últimos 30 días.
    'Win' = retorno >= +1% en 24h.
    """
    if not _pool:
        return {}
    try:
        async with _pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT
                    price_range,
                    COUNT(*)                                    AS total,
                    COUNT(*) FILTER (WHERE return_pct >= 1.0)  AS wins,
                    ROUND(AVG(return_pct)::numeric, 2)         AS avg_return,
                    ROUND(MAX(return_pct)::numeric, 2)         AS best_return
                FROM alert_history
                WHERE closed_at IS NOT NULL
                AND created_at > NOW() - INTERVAL '30 days'
                GROUP BY price_range
            """)
            result = {}
            for row in rows:
                key = row["price_range"] or "all"
                total = row["total"]
                wins = row["wins"]
                result[key] = {
                    "total": total,
                    "wins": wins,
                    "win_rate": round(wins / total * 100, 1) if total > 0 else 0,
                    "avg_return": float(row["avg_return"] or 0),
                    "best_return": float(row["best_return"] or 0),
                }
            return result
    except Exception as e:
        logger.error(f"Error obteniendo win stats: {e}")
        return {}
