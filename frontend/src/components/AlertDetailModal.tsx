import { useEffect, useState } from 'react'
import { X, TrendingUp, TrendingDown, Target, ChevronUp, ChevronDown } from 'lucide-react'
import { Alert, StockEntry, SymbolHistoryEntry, WinRangeStats } from '../types'
import { api } from '../services/api'
import { calcFibLevels, detectOptimalBuy } from './FibonacciAnalysis'

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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
  } catch { return '—' }
}

function ReturnBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-gray-500 italic">abierta</span>
  const positive = value >= 0
  return (
    <span className={`text-xs font-bold font-mono ${positive ? 'text-gain' : 'text-loss'}`}>
      {positive ? '+' : ''}{value.toFixed(2)}%
    </span>
  )
}

interface Props {
  alert: Alert
  entry: StockEntry | null
  winStats?: WinRangeStats
  onClose: () => void
}

export default function AlertDetailModal({ alert, entry, winStats, onClose }: Props) {
  const [history, setHistory] = useState<SymbolHistoryEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    api.symbolHistory(alert.symbol)
      .then(res => setHistory(res.data ?? []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false))
  }, [alert.symbol])

  const sem = entry ? getSemaphore(entry) : null
  const levels = entry && entry.high > entry.low ? calcFibLevels(entry.high, entry.low) : null
  const isOptimalBuy = entry && levels ? detectOptimalBuy(entry, levels) : false
  const fib618 = levels?.find(l => l.ratio === 0.618)
  const distToGolden = entry && fib618
    ? ((entry.price - fib618.price) / fib618.price * 100)
    : null

  const AlertIcon = alert.type === 'opportunity_alert' ? Target
    : alert.type === 'gainer_alert' ? TrendingUp : TrendingDown
  const iconColor = alert.type === 'opportunity_alert' ? 'text-opportunity'
    : alert.type === 'gainer_alert' ? 'text-gain' : 'text-loss'

  const closedHistory = history.filter(h => h.closed_at !== null)
  const wins = closedHistory.filter(h => (h.return_pct ?? 0) >= 1).length
  const symbolWinRate = closedHistory.length > 0
    ? Math.round(wins / closedHistory.length * 100)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-surface border border-surface-border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-surface-border shrink-0">
          <div className="flex items-center gap-2.5">
            <AlertIcon size={16} className={iconColor} />
            <div>
              <span className="text-base font-bold text-white">{alert.symbol}</span>
              {entry && <span className="text-xs text-gray-500 ml-2">{entry.name}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="overflow-y-auto flex flex-col gap-4 p-4">

          {/* Precio + cambio */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-white">${alert.price.toFixed(2)}</span>
              {entry && (
                <span className={`ml-2 text-sm font-semibold ${entry.change_pct >= 0 ? 'text-gain' : 'text-loss'}`}>
                  {entry.change_pct >= 0 ? <ChevronUp size={14} className="inline" /> : <ChevronDown size={14} className="inline" />}
                  {Math.abs(entry.change_pct).toFixed(2)}%
                </span>
              )}
            </div>
            {entry && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Score</div>
                <div className={`text-lg font-bold ${entry.score >= 75 ? 'text-gain' : entry.score >= 60 ? 'text-opportunity' : 'text-gray-400'}`}>
                  {entry.score}
                </div>
              </div>
            )}
          </div>

          {/* ── ¿Es el momento? ── */}
          {entry ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">¿Es el momento?</p>

              {/* Semáforo */}
              {sem ? (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  sem === 'green' ? 'border-gain/30 bg-gain-bg' :
                  sem === 'yellow' ? 'border-opportunity/30 bg-opportunity-bg' :
                  'border-loss/30 bg-loss-bg'
                }`}>
                  <span className="text-base">{sem === 'green' ? '🟢' : sem === 'yellow' ? '🟡' : '🔴'}</span>
                  <div>
                    <span className={`text-xs font-bold ${sem === 'green' ? 'text-gain' : sem === 'yellow' ? 'text-opportunity' : 'text-loss'}`}>
                      {sem === 'green' ? 'Compra óptima' : sem === 'yellow' ? 'Preparar entrada' : 'Precio extendido'}
                    </span>
                    <p className="text-xs text-gray-500 leading-snug">
                      {sem === 'green' ? 'Fibonacci 61.8% + Z-Score normalizado. Confluencia técnica perfecta.' :
                       sem === 'yellow' ? 'Precio acercándose al nivel dorado. Vigilar.' :
                       'Z-Score elevado — precio alejado de su media. Esperar retroceso.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 rounded-lg border border-surface-border bg-surface">
                  <p className="text-xs text-gray-500">Sin confluencia técnica clara en este momento.</p>
                </div>
              )}

              {/* Fibonacci 61.8% */}
              {fib618 && distToGolden !== null && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-surface-border bg-surface">
                  <div>
                    <span className="text-xs text-yellow-400 font-bold">✦ Nivel Golden 61.8%</span>
                    <p className="text-xs text-gray-500">${fib618.price.toFixed(2)}</p>
                  </div>
                  <span className={`text-xs font-mono font-semibold ${Math.abs(distToGolden) <= 2 ? 'text-gain' : Math.abs(distToGolden) <= 5 ? 'text-opportunity' : 'text-gray-500'}`}>
                    {distToGolden > 0 ? '+' : ''}{distToGolden.toFixed(1)}% del precio
                  </span>
                </div>
              )}

              {/* Z-Score */}
              {entry.z_score !== null && (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-surface-border bg-surface">
                  <span className="text-xs text-gray-400">Z-Score intraday</span>
                  <span className={`text-xs font-mono font-bold ${
                    entry.z_score > 1.5 ? 'text-loss' :
                    entry.z_score >= -1.0 && entry.z_score <= 0.3 ? 'text-gain' :
                    'text-gray-400'
                  }`}>
                    {entry.z_score > 0 ? '+' : ''}{entry.z_score.toFixed(2)}
                    <span className="font-normal text-gray-600 ml-1">
                      {entry.z_score > 1.5 ? '— extendido' : entry.z_score >= -1.0 && entry.z_score <= 0.3 ? '— normalizado' : '— neutro'}
                    </span>
                  </span>
                </div>
              )}

              {/* COMPRA ÓPTIMA */}
              {isOptimalBuy && (
                <div className="px-3 py-2.5 rounded-lg border-2 border-yellow-400 bg-yellow-400/10 flex items-center gap-2">
                  <span className="text-base">⭐</span>
                  <div>
                    <span className="text-xs font-bold text-yellow-400">COMPRA ÓPTIMA</span>
                    <p className="text-xs text-yellow-200/70">Fibonacci 61.8% + Z-Score alineados. La confluencia más buscada.</p>
                  </div>
                </div>
              )}

              {/* Señal */}
              <div className="px-3 py-2 rounded-lg border border-surface-border bg-surface">
                <span className="text-xs text-gray-500">Señal: </span>
                <span className={`text-xs font-medium ${
                  entry.signal_type === 'buy_watch' ? 'text-gain' :
                  entry.signal_type === 'caution' ? 'text-opportunity' :
                  entry.signal_type === 'danger' ? 'text-loss' : 'text-gray-400'
                }`}>{entry.signal}</span>
              </div>

              {/* Niveles de trade */}
              {entry.trade_levels && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Entrada', value: entry.trade_levels.entry, color: 'text-white' },
                    { label: 'Stop',    value: entry.trade_levels.stop,    color: 'text-loss'  },
                    { label: 'Target',  value: entry.trade_levels.target1, color: 'text-gain'  },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex flex-col items-center py-2 rounded-lg border border-surface-border bg-surface">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className={`text-xs font-bold font-mono ${color}`}>${value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="px-3 py-2 rounded-lg border border-surface-border">
              <p className="text-xs text-gray-500">Análisis técnico no disponible para esta alerta.</p>
            </div>
          )}

          {/* ── Historial del símbolo ── */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Historial de señales</p>
              {symbolWinRate !== null && closedHistory.length >= 2 && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${symbolWinRate >= 60 ? 'bg-gain/10 text-gain' : symbolWinRate >= 40 ? 'bg-opportunity/10 text-opportunity' : 'bg-loss/10 text-loss'}`}>
                  {symbolWinRate}% efectividad
                </span>
              )}
            </div>

            {loadingHistory ? (
              <p className="text-xs text-gray-600 text-center py-3">Cargando historial...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-3">Sin señales previas registradas.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border border-surface-border bg-surface">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">{formatDate(h.created_at)}</span>
                      <span className="text-xs font-mono text-gray-400">${h.entry_price.toFixed(2)}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded text-white ${h.score >= 70 ? 'bg-gain/60' : h.score >= 50 ? 'bg-opportunity/60' : 'bg-gray-700'}`}>
                        {h.score}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {h.closed_price && (
                        <span className="text-xs font-mono text-gray-500">${h.closed_price.toFixed(2)}</span>
                      )}
                      <ReturnBadge value={h.return_pct} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Win rate del bucket */}
          {winStats && winStats.total >= 3 && (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-brand/20 bg-brand/5">
              <div>
                <p className="text-xs font-bold text-brand">Efectividad del bucket</p>
                <p className="text-xs text-gray-500">{winStats.total} señales · promedio {winStats.avg_return > 0 ? '+' : ''}{winStats.avg_return.toFixed(1)}%</p>
              </div>
              <span className={`text-lg font-bold ${winStats.win_rate >= 60 ? 'text-gain' : winStats.win_rate >= 40 ? 'text-opportunity' : 'text-loss'}`}>
                {winStats.win_rate}%
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
