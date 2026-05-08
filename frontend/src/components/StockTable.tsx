import { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Zap, Crown, Loader2, ChevronDown } from 'lucide-react'
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
  accentColor: string
  emptyMsg: string
}> = {
  gainer: {
    title: 'Top Ganadoras',
    subtitle: 'Mayor subida % del día',
    Icon: TrendingUp,
    headerColor: 'text-gain',
    borderColor: 'border-gain/25',
    accentColor: 'bg-gain',
    emptyMsg: 'No hay ganadoras aún',
  },
  loser: {
    title: 'Top Perdedoras',
    subtitle: 'Mayor caída % del día',
    Icon: TrendingDown,
    headerColor: 'text-loss',
    borderColor: 'border-loss/25',
    accentColor: 'bg-loss',
    emptyMsg: 'No hay perdedoras aún',
  },
  opp_low: {
    title: 'Tentación · $1 – $10',
    subtitle: 'Mejor score, precio bajo',
    Icon: DollarSign,
    headerColor: 'text-opportunity',
    borderColor: 'border-opportunity/25',
    accentColor: 'bg-opportunity',
    emptyMsg: 'Sin candidatos en este rango',
  },
  opp_mid: {
    title: 'Tentación · $10 – $20',
    subtitle: 'Mejor score, precio medio',
    Icon: Zap,
    headerColor: 'text-opportunity',
    borderColor: 'border-opportunity/25',
    accentColor: 'bg-opportunity',
    emptyMsg: 'Sin candidatos en este rango',
  },
  opp_top: {
    title: 'Tentación · Lo Mejor',
    subtitle: 'Top absoluto sin límite de precio',
    Icon: Crown,
    headerColor: 'text-opportunity',
    borderColor: 'border-opportunity/30',
    accentColor: 'bg-opportunity',
    emptyMsg: 'Sin oportunidades detectadas',
  },
}

const OPP_VARIANTS = new Set<Variant>(['opp_low', 'opp_mid', 'opp_top'])

export default function StockTable({ variant, entries, loading, onSelectStock }: Props) {
  const { title, subtitle, Icon, headerColor, borderColor, accentColor, emptyMsg } = CONFIG[variant]
  const isOpp = OPP_VARIANTS.has(variant)
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className={`rounded-xl border ${borderColor} bg-surface-card overflow-hidden`}>

      {/* Barra de acento superior */}
      <div className={`h-0.5 w-full ${accentColor} opacity-60`} />

      {/* Header — clickeable en móvil */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer sm:cursor-default select-none"
        onClick={() => setIsOpen(o => !o)}
      >
        <div className="flex items-center gap-2.5">
          <Icon size={16} className={headerColor} />
          <div>
            <h2 className={`text-sm font-bold ${headerColor}`}>{title}</h2>
            <p className="text-xs text-gray-600 hidden sm:block">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${headerColor} bg-surface-border px-2 py-0.5 rounded-full`}>
            {entries.length}
          </span>
          {/* Chevron solo visible en móvil */}
          <ChevronDown
            size={16}
            className={`sm:hidden transition-transform duration-300 ${headerColor} ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          />
        </div>
      </div>

      {/* Subtítulo visible en móvil cuando está abierto */}
      {isOpen && (
        <p className="sm:hidden text-xs text-gray-600 px-4 pb-2 -mt-1">{subtitle}</p>
      )}

      {/* Separador */}
      <div className={`h-px mx-4 ${isOpen ? 'block' : 'hidden sm:block'} bg-surface-border`} />

      {/* Contenido — colapsable en móvil */}
      <div className={`${isOpen ? 'block' : 'hidden sm:block'} p-3 flex flex-col gap-2`}>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-600">
            <Loader2 size={20} className="animate-spin mr-2" />
            <span className="text-sm">Cargando datos del mercado...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-gray-600 text-sm">
            {emptyMsg}
          </div>
        ) : (
          entries.map((entry, i) => (
            <StockRow
              key={entry.symbol}
              entry={entry}
              variant={isOpp ? 'opportunity' : variant as 'gainer' | 'loser'}
              rank={i + 1}
              onClick={onSelectStock}
            />
          ))
        )}
      </div>
    </div>
  )
}
