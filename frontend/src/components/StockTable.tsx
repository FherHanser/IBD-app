import { TrendingUp, TrendingDown, DollarSign, Zap, Crown, Loader2 } from 'lucide-react'
import { StockEntry } from '../types'
import StockRow from './StockRow'

type Variant = 'gainer' | 'loser' | 'opp_low' | 'opp_mid' | 'opp_top'

interface Props {
  variant: Variant
  entries: StockEntry[]
  loading?: boolean
  onSelectStock: (entry: StockEntry) => void
}

const CONFIG: Record<Variant, {
  title: string
  subtitle: string
  Icon: React.ComponentType<any>
  headerColor: string
  borderColor: string
  emptyMsg: string
}> = {
  gainer: {
    title: 'Top Ganadoras',
    subtitle: 'Mayor subida % del día',
    Icon: TrendingUp,
    headerColor: 'text-gain',
    borderColor: 'border-gain/20',
    emptyMsg: 'No hay ganadoras aún',
  },
  loser: {
    title: 'Top Perdedoras',
    subtitle: 'Mayor caída % del día',
    Icon: TrendingDown,
    headerColor: 'text-loss',
    borderColor: 'border-loss/20',
    emptyMsg: 'No hay perdedoras aún',
  },
  opp_low: {
    title: 'Tentación · $1 – $10',
    subtitle: 'Mejor score, precio bajo',
    Icon: DollarSign,
    headerColor: 'text-opportunity',
    borderColor: 'border-opportunity/20',
    emptyMsg: 'Sin candidatos en este rango',
  },
  opp_mid: {
    title: 'Tentación · $10 – $20',
    subtitle: 'Mejor score, precio medio',
    Icon: Zap,
    headerColor: 'text-opportunity',
    borderColor: 'border-opportunity/20',
    emptyMsg: 'Sin candidatos en este rango',
  },
  opp_top: {
    title: 'Tentación · Lo Mejor',
    subtitle: 'Top absoluto sin límite de precio',
    Icon: Crown,
    headerColor: 'text-opportunity',
    borderColor: 'border-opportunity/30',
    emptyMsg: 'Sin oportunidades detectadas',
  },
}

const OPP_VARIANTS = new Set<Variant>(['opp_low', 'opp_mid', 'opp_top'])

export default function StockTable({ variant, entries, loading, onSelectStock }: Props) {
  const { title, subtitle, Icon, headerColor, borderColor, emptyMsg } = CONFIG[variant]
  const isOpp = OPP_VARIANTS.has(variant)

  return (
    <div className={`card border ${borderColor} flex flex-col gap-3`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} className={headerColor} />
          <div>
            <h2 className={`text-sm font-bold ${headerColor}`}>{title}</h2>
            <p className="text-xs text-gray-600">{subtitle}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold ${headerColor} bg-surface-border px-2 py-0.5 rounded`}>
          {entries.length}
        </span>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-600">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">Cargando datos del mercado...</span>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-gray-600 text-sm">
          {emptyMsg}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry, i) => (
            <StockRow
              key={entry.symbol}
              entry={entry}
              variant={isOpp ? 'opportunity' : variant as 'gainer' | 'loser'}
              rank={i + 1}
              onClick={onSelectStock}
            />
          ))}
        </div>
      )}
    </div>
  )
}
