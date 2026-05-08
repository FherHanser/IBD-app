import { Activity, Clock, Wifi, WifiOff, HelpCircle } from 'lucide-react'
import { MarketSession } from '../types'
import { WsStatus } from '../hooks/useWebSocket'

interface Props {
  session: MarketSession | null
  lastUpdate: string | null
  wsStatus: WsStatus
  totalProcessed: number
  onHelp: () => void
}

const SESSION_COLORS: Record<string, string> = {
  market:      'text-gain',
  pre_market:  'text-opportunity',
  after_hours: 'text-opportunity',
  closed:      'text-gray-500',
}

const SESSION_DOT: Record<string, string> = {
  market:      'bg-gain animate-pulse',
  pre_market:  'bg-opportunity',
  after_hours: 'bg-opportunity',
  closed:      'bg-gray-600',
}

export default function MarketHeader({ session, lastUpdate, wsStatus, totalProcessed, onHelp }: Props) {
  const sessionKey  = session?.session ?? 'closed'
  const colorClass  = SESSION_COLORS[sessionKey] ?? 'text-gray-400'
  const dotClass    = SESSION_DOT[sessionKey]    ?? 'bg-gray-600'

  const formattedUpdate = lastUpdate
    ? new Date(lastUpdate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—'

  return (
    <header className="border-b border-surface-border bg-surface-card px-4 sm:px-6 py-3">
      {/* Fila principal */}
      <div className="flex items-center justify-between gap-2">

        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Activity className="text-brand" size={20} />
          <div>
            <h1 className="text-sm font-semibold text-white tracking-wide">CNTNL - VALUE</h1>
            <p className="text-xs text-gray-500 hidden sm:block">Alertas y Señales Intradía</p>
          </div>
        </div>

        {/* Sesión — centro */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
          <span className={`text-xs sm:text-sm font-semibold truncate ${colorClass}`}>
            {session?.label ?? 'Conectando...'}
          </span>
          {session?.time_et && (
            <span className="text-xs text-gray-500 hidden md:inline">{session.time_et}</span>
          )}
        </div>

        {/* Derecha */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-500 shrink-0">
          {/* Stats — solo md+ */}
          <div className="hidden md:flex items-center gap-4">
            {totalProcessed > 0 && <span>{totalProcessed} acciones</span>}
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>Actualizado: <span className="text-gray-300">{formattedUpdate}</span></span>
            </div>
            <span className="text-gray-600">15 min delay</span>
          </div>

          <WsIndicator status={wsStatus} />

          <button
            onClick={onHelp}
            className="flex items-center gap-1 text-gray-500 hover:text-brand transition-colors"
            title="Cómo leer el tablero"
          >
            <HelpCircle size={15} />
            <span className="hidden sm:inline text-xs">Ayuda</span>
          </button>
        </div>
      </div>

      {/* Fila secundaria — visible solo en sm, oculta en md+ (donde ya aparece arriba) */}
      <div className="flex sm:flex md:hidden items-center gap-3 text-xs text-gray-500 mt-1.5 pl-7">
        {totalProcessed > 0 && <span>{totalProcessed} acc.</span>}
        <div className="flex items-center gap-1">
          <Clock size={11} />
          <span className="text-gray-300">{formattedUpdate}</span>
        </div>
        <span className="text-gray-600">15 min delay</span>
      </div>
    </header>
  )
}

function WsIndicator({ status }: { status: WsStatus }) {
  if (status === 'connected') {
    return (
      <div className="flex items-center gap-1 text-gain">
        <Wifi size={13} />
        <span className="hidden sm:inline">En vivo</span>
      </div>
    )
  }
  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-1 text-opportunity animate-pulse">
        <Wifi size={13} />
        <span className="hidden sm:inline">Conectando...</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 text-loss">
      <WifiOff size={13} />
      <span className="hidden sm:inline">Desconectado</span>
    </div>
  )
}
