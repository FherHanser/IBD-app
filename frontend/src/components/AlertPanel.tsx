import { Bell, TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react'
import { Alert } from '../types'

interface Props {
  alerts: Alert[]
}

const TYPE_CONFIG = {
  gainer_alert: {
    Icon: TrendingUp,
    color: 'text-gain',
    bg: 'bg-gain-bg',
    border: 'border-gain/20',
  },
  loser_alert: {
    Icon: TrendingDown,
    color: 'text-loss',
    bg: 'bg-loss-bg',
    border: 'border-loss/20',
  },
  opportunity_alert: {
    Icon: Target,
    color: 'text-opportunity',
    bg: 'bg-opportunity-bg',
    border: 'border-opportunity/20',
  },
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function ScoreDot({ score }: { score: number }) {
  const color =
    score >= 75 ? 'bg-gain'        :
    score >= 60 ? 'bg-opportunity' :
    score >= 45 ? 'bg-yellow-600'  :
    'bg-gray-600'
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded ${color} text-white`}>
      {score}
    </span>
  )
}

export default function AlertPanel({ alerts }: Props) {
  const oppAlerts    = alerts.filter(a => a.type === 'opportunity_alert')
  const actionAlerts = alerts.filter(a => a.type !== 'opportunity_alert')

  return (
    <div className="card border border-surface-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-brand" />
          <h2 className="text-sm font-bold text-white">Alertas Activas</h2>
        </div>
        <span className="text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded">
          {alerts.length}
        </span>
      </div>

      {alerts.length === 0 ? (
        <p className="text-xs text-gray-600 py-4 text-center">Sin alertas activas</p>
      ) : (
        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">

          {/* ── Oportunidades de compra ordenadas por score ── */}
          {oppAlerts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-bold text-opportunity uppercase tracking-widest px-1">
                Tentación de Compra
              </p>
              {oppAlerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-opportunity/20 bg-opportunity-bg"
                >
                  <span className="text-xs font-mono font-bold text-white w-5 text-right shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">{alert.symbol}</span>
                      <span className="text-xs text-gray-400 font-mono">${alert.price.toFixed(2)}</span>
                      {(alert as any).score > 0 && <ScoreDot score={(alert as any).score} />}
                      {alert.severity === 'high' && (
                        <AlertTriangle size={10} className="text-gain" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-snug mt-0.5 truncate">{alert.message}</p>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">{formatTimestamp(alert.timestamp)}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Movimientos extremos del día ── */}
          {actionAlerts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {oppAlerts.length > 0 && (
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 mt-1">
                  Movimientos del día
                </p>
              )}
              {actionAlerts.map((alert, i) => {
                const cfg = TYPE_CONFIG[alert.type] ?? TYPE_CONFIG.loser_alert
                const { Icon, color, bg, border } = cfg
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${border} ${bg}`}
                  >
                    <Icon size={13} className={`${color} shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${color}`}>{alert.symbol}</span>
                        <span className="text-xs text-gray-400 font-mono">${alert.price.toFixed(2)}</span>
                        <span className="text-xs text-gray-600">{formatTimestamp(alert.timestamp)}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-snug mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
