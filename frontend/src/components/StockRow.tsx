import { ChevronUp, ChevronDown, Minus } from 'lucide-react'
import { StockEntry } from '../types'
import ScoreBar from './ScoreBar'
import RiskBadge from './RiskBadge'

type SemaphoreState = 'green' | 'yellow' | 'red' | null

function getSemaphore(entry: StockEntry): SemaphoreState {
  const { price, high, low, z_score } = entry
  if (high <= low) return null

  const fib618 = high - (high - low) * 0.618
  const distPct = Math.abs(price - fib618) / fib618 * 100

  if (distPct <= 2.0 && z_score !== null && z_score >= -1.0 && z_score <= 0.3) return 'green'
  if (z_score !== null && z_score > 1.5) return 'red'
  if (distPct <= 5.0) return 'yellow'
  return null
}

const SEMAPHORE_CONFIG = {
  green:  { dot: '🟢', label: 'Compra óptima', color: 'text-gain'        },
  yellow: { dot: '🟡', label: 'Preparar',       color: 'text-opportunity' },
  red:    { dot: '🔴', label: 'Extendido',       color: 'text-loss'        },
}

interface Props {
  entry: StockEntry
  variant: 'gainer' | 'loser' | 'opportunity'
  rank: number
  onClick: (entry: StockEntry) => void
}

const SIGNAL_COLORS: Record<string, string> = {
  buy_watch: 'text-gain',
  caution: 'text-opportunity',
  danger: 'text-loss',
  info: 'text-gray-400',
}

const CONFIDENCE_COLORS: Record<string, string> = {
  alta: 'text-gain',
  media: 'text-opportunity',
  baja: 'text-gray-500',
}

export default function StockRow({ entry, variant, rank, onClick }: Props) {
  const isPositive = entry.change_pct >= 0
  const changeColor = isPositive ? 'text-gain' : 'text-loss'
  const ChangeIcon = isPositive
    ? ChevronUp
    : entry.change_pct < 0
    ? ChevronDown
    : Minus

  const volColor =
    entry.volume_relative >= 2
      ? 'text-gain'
      : entry.volume_relative >= 1.5
      ? 'text-opportunity'
      : 'text-gray-400'

  const signalColor = SIGNAL_COLORS[entry.signal_type] ?? 'text-gray-400'

  return (
    <div
      className="group flex flex-col gap-2 p-3 rounded-lg border border-surface-border bg-surface hover:bg-surface-hover hover:border-brand/40 transition-colors cursor-pointer"
      onClick={() => onClick(entry)}
      title="Clic para ver análisis detallado"
    >
      {/* Fila principal */}
      <div className="flex items-center gap-3">
        {/* Rank */}
        <span className="text-xs text-gray-600 w-4 shrink-0">{rank}</span>

        {/* Símbolo + nombre */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{entry.symbol}</span>
            {variant === 'opportunity' && (
              <ScoreBar
                score={entry.score}
                band={entry.score_band}
                icon={entry.score_icon}
                size="sm"
              />
            )}
          </div>
          <span className="text-xs text-gray-500 truncate block">{entry.name}</span>
        </div>

        {/* Precio + cambio */}
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-white">
            ${entry.price.toFixed(2)}
          </div>
          <div className={`flex items-center justify-end gap-0.5 text-xs font-semibold ${changeColor}`}>
            <ChangeIcon size={12} />
            {Math.abs(entry.change_pct).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Fila de indicadores */}
      <div className="flex items-center gap-3 text-xs flex-wrap">
        {/* Volumen relativo */}
        <span className={`${volColor}`}>
          Vol {entry.volume_relative.toFixed(1)}x
        </span>

        {/* Gap */}
        {entry.gap_pct !== null && entry.gap_pct !== undefined && Math.abs(entry.gap_pct) >= 0.5 && (
          <span className={entry.gap_pct > 0 ? 'text-gain' : 'text-loss'}>
            Gap {entry.gap_pct > 0 ? '+' : ''}{entry.gap_pct.toFixed(1)}%
          </span>
        )}

        {/* RSI */}
        {entry.rsi !== null && (
          <span className={`${entry.rsi < 35 ? 'text-gain' : entry.rsi > 65 ? 'text-loss' : 'text-gray-400'}`}>
            RSI {entry.rsi.toFixed(0)}
          </span>
        )}

        {/* VWAP */}
        {entry.above_vwap !== null && (
          <span className={entry.above_vwap ? 'text-gain' : 'text-gray-500'}>
            {entry.above_vwap ? '▲ VWAP' : '▼ VWAP'}
          </span>
        )}

        {/* RS vs SPY (solo oportunidades) */}
        {variant === 'opportunity' && entry.rs_spy !== null && (
          <span className={entry.rs_spy > 0 ? 'text-gain' : 'text-gray-500'}>
            RS {entry.rs_spy > 0 ? '+' : ''}{entry.rs_spy.toFixed(1)}%
          </span>
        )}

        {/* Semáforo (solo oportunidades) */}
        {variant === 'opportunity' && (() => {
          const sem = getSemaphore(entry)
          if (!sem) return null
          const { dot, label, color } = SEMAPHORE_CONFIG[sem]
          return (
            <span
              className={`text-xs font-semibold ${color}`}
              title={
                sem === 'green'  ? `Fibonacci 61.8% + Z-Score ${entry.z_score !== null ? (entry.z_score > 0 ? '+' : '') + entry.z_score.toFixed(2) : '—'} — confluencia óptima de compra` :
                sem === 'red'    ? `Z-Score ${entry.z_score !== null ? '+' + entry.z_score.toFixed(2) : '—'} — precio muy extendido sobre su media` :
                                   'Precio acercándose al nivel dorado 61.8% de Fibonacci'
              }
            >
              {dot} {label}
            </span>
          )
        })()}

        {/* R:R (solo oportunidades) */}
        {variant === 'opportunity' && entry.trade_levels && (
          <span className={
            entry.trade_levels.rr1 >= 2.5 ? 'text-gain font-semibold' :
            entry.trade_levels.rr1 >= 1.5 ? 'text-opportunity' :
            'text-gray-500'
          } title={`Riesgo/Recompensa: por cada $1 arriesgado, potencial ganancia de $${entry.trade_levels.rr1.toFixed(1)}`}>
            R:R {entry.trade_levels.rr1.toFixed(1)}
          </span>
        )}

        {/* Tendencia */}
        <span className={
          entry.ema_trend === 'alcista' ? 'text-gain' :
          entry.ema_trend === 'bajista' ? 'text-loss' :
          'text-gray-500'
        }>
          {entry.ema_trend.replace('_', ' ')}
        </span>

        {/* Riesgo */}
        <RiskBadge risk={entry.risk as any} />
      </div>

      {/* Setup label (solo oportunidades y ganadoras con setup relevante) */}
      {entry.setup_key !== 'undefined' && (variant === 'opportunity' || variant === 'gainer') && (
        <div className="flex items-center gap-1.5 text-xs">
          <span className={`font-medium ${CONFIDENCE_COLORS[entry.setup_confidence] ?? 'text-gray-500'}`}>
            ◆ {entry.setup_label}
          </span>
          {entry.setup_reason && (
            <span className="text-gray-600 truncate">— {entry.setup_reason}</span>
          )}
        </div>
      )}

      {/* Señal textual */}
      <p className={`text-xs leading-snug ${signalColor}`}>
        {entry.signal}
      </p>

      {/* Razones del score (solo en oportunidades) */}
      {variant === 'opportunity' && entry.score_reasons.length > 0 && (
        <p className="text-xs text-gray-600">
          {entry.score_reasons.join(' · ')}
        </p>
      )}
    </div>
  )
}
