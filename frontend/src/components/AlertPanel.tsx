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

const SEVERITY_PULSE: Record<string, string> = {
  high: 'animate-pulse',
  medium: '',
  low: '',
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '—'
  }
}

export default function AlertPanel({ alerts }: Props) {
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
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {alerts.map((alert, i) => {
            const cfg = TYPE_CONFIG[alert.type] ?? TYPE_CONFIG.loser_alert
            const { Icon, color, bg, border } = cfg
            const pulseClass = SEVERITY_PULSE[alert.severity] ?? ''

            return (
              <div
                key={i}
                className={`flex items-start gap-2 p-2.5 rounded-lg border ${border} ${bg}`}
              >
                <Icon size={14} className={`${color} ${pulseClass} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${color}`}>{alert.symbol}</span>
                    <span className="text-xs text-gray-600">{formatTimestamp(alert.timestamp)}</span>
                    {alert.severity === 'high' && (
                      <AlertTriangle size={11} className="text-loss" />
                    )}
                  </div>
                  <p className="text-xs text-gray-300 leading-snug mt-0.5">{alert.message}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
