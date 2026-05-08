import { useState } from 'react'
import { MarketState, StockEntry } from '../types'
import { WsStatus } from '../hooks/useWebSocket'
import MarketHeader from './MarketHeader'
import StockTable from './StockTable'
import AlertPanel from './AlertPanel'
import HelpModal from './HelpModal'
import StockDetailModal from './StockDetailModal'

interface Props {
  data: MarketState | null
  wsStatus: WsStatus
}

export default function Dashboard({ data, wsStatus }: Props) {
  const loading = !data || data.status === 'initializing'
  const [showHelp, setShowHelp] = useState(false)
  const [selectedStock, setSelectedStock] = useState<StockEntry | null>(null)

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <MarketHeader
        session={data?.market_session ?? null}
        lastUpdate={data?.last_update ?? null}
        wsStatus={wsStatus}
        totalProcessed={data?.total_processed ?? 0}
        onHelp={() => setShowHelp(true)}
      />

      {data?.status === 'error' && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-loss-bg border border-loss/30 text-loss text-xs">
          Error obteniendo datos. El sistema intentará reconectar automáticamente.
        </div>
      )}

      <main className="flex-1 p-4 flex flex-col gap-4">
        {/* Fila 1: Ganadoras y Perdedoras */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StockTable
            variant="gainer"
            entries={data?.gainers ?? []}
            loading={loading}
            onSelectStock={setSelectedStock}
          />
          <StockTable
            variant="loser"
            entries={data?.losers ?? []}
            loading={loading}
            onSelectStock={setSelectedStock}
          />
        </div>

        {/* Fila 2: Tentación de Compra — 3 rangos de precio */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StockTable
            variant="opp_low"
            entries={data?.opp_low ?? []}
            loading={loading}
            onSelectStock={setSelectedStock}
          />
          <StockTable
            variant="opp_mid"
            entries={data?.opp_mid ?? []}
            loading={loading}
            onSelectStock={setSelectedStock}
          />
          <StockTable
            variant="opp_top"
            entries={data?.opp_top ?? []}
            loading={loading}
            onSelectStock={setSelectedStock}
          />
        </div>
      </main>

      <div className="px-4 pb-4">
        <AlertPanel alerts={data?.alerts ?? []} />
      </div>

      <footer className="border-t border-surface-border px-6 py-2 text-xs text-gray-700 flex justify-between">
        <span>CNTNL - VALUE v1.0 · Datos con 15 min de delay via Yahoo Finance</span>
        <span>No es asesoramiento financiero. Úsalo con criterio propio.</span>
      </footer>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {selectedStock && <StockDetailModal entry={selectedStock} onClose={() => setSelectedStock(null)} />}
    </div>
  )
}
