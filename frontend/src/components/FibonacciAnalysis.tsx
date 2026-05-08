import { StockEntry } from '../types'

interface FibLevel {
  label: string
  ratio: number
  price: number
  isKey: boolean
  isGolden: boolean
}

function calcFibLevels(high: number, low: number): FibLevel[] {
  const range = high - low
  const ratios = [
    { label: '0%',    ratio: 0,     isKey: false, isGolden: false },
    { label: '23.6%', ratio: 0.236, isKey: false, isGolden: false },
    { label: '38.2%', ratio: 0.382, isKey: true,  isGolden: false },
    { label: '50%',   ratio: 0.5,   isKey: true,  isGolden: false },
    { label: '61.8%', ratio: 0.618, isKey: true,  isGolden: true  },
    { label: '78.6%', ratio: 0.786, isKey: false, isGolden: false },
    { label: '100%',  ratio: 1.0,   isKey: false, isGolden: false },
  ]
  return ratios.map(r => ({
    ...r,
    price: parseFloat((high - range * r.ratio).toFixed(2)),
  }))
}

function getNearestLevel(price: number, levels: FibLevel[]): { level: FibLevel; distance: number } {
  let nearest = levels[0]
  let minDist = Infinity
  for (const l of levels) {
    const d = Math.abs(price - l.price)
    if (d < minDist) { minDist = d; nearest = l }
  }
  return { level: nearest, distance: minDist }
}

function getZoneColor(ratio: number): string {
  if (ratio === 0.618) return 'border-yellow-400 bg-yellow-400/10'
  if (ratio === 0.382 || ratio === 0.5) return 'border-brand/50 bg-brand/5'
  return 'border-surface-border bg-transparent'
}

function getLevelTextColor(ratio: number, isGolden: boolean): string {
  if (isGolden) return 'text-yellow-400'
  if (ratio === 0.382 || ratio === 0.5) return 'text-brand'
  if (ratio === 0 || ratio === 1.0) return 'text-gray-500'
  return 'text-gray-400'
}

function interpretLevel(level: FibLevel, entry: StockEntry): string {
  const { ratio } = level
  const falling = entry.change_pct < 0

  if (ratio === 0.236) return falling
    ? 'Primer retroceso — soporte débil, suele romperse en caídas fuertes.'
    : 'Primera resistencia — extensión leve de la subida.'
  if (ratio === 0.382) return falling
    ? 'Soporte moderado — zona donde retrocesos sanos suelen pausarse.'
    : 'Resistencia intermedia — punto de decisión en recuperación.'
  if (ratio === 0.5)   return falling
    ? 'Soporte medio — mitad exacta del rango. Nivel psicológico importante.'
    : 'Resistencia clave — 50% de recuperación, zona de evaluación.'
  if (ratio === 0.618) return falling
    ? '🔑 Nivel dorado — la zona más importante. Alta probabilidad de rebote si el precio aguanta aquí.'
    : '🔑 Resistencia dorada — si la rompe con volumen, señal fuerte de continuación.'
  if (ratio === 0.786) return falling
    ? 'Soporte profundo — caída extendida. El movimiento original está muy comprometido.'
    : 'Resistencia fuerte — recuperación casi completa, evaluar momentum.'
  if (ratio === 0)     return 'Máximo del día — zona de resistencia superior.'
  if (ratio === 1.0)   return 'Mínimo del día — soporte extremo del rango intradía.'
  return ''
}

interface Props {
  entry: StockEntry
}

export default function FibonacciAnalysis({ entry }: Props) {
  const { high, low, price, vwap, open } = entry
  const range = high - low

  if (range <= 0) {
    return <p className="text-xs text-gray-500 py-4 text-center">Rango insuficiente para calcular Fibonacci.</p>
  }

  const levels = calcFibLevels(high, low)
  const { level: nearestLevel } = getNearestLevel(price, levels)

  // Posición del precio en el rango (0 = low, 100 = high)
  const pricePos = ((price - low) / range) * 100

  return (
    <div className="flex flex-col gap-5">

      {/* Título + contexto */}
      <div>
        <h3 className="text-sm font-bold text-white mb-1">Análisis Fibonacci Intradía</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Niveles calculados sobre el rango del día: mínimo ${low.toFixed(2)} → máximo ${high.toFixed(2)} (rango ${range.toFixed(2)}).
          El precio actual está cerca del nivel <span className="text-white font-semibold">{nearestLevel.label}</span>.
        </p>
      </div>

      {/* Barra visual vertical */}
      <div className="flex gap-4 items-stretch">

        {/* Barra de precio */}
        <div className="relative w-8 shrink-0">
          {/* Barra de fondo (rango completo) */}
          <div className="absolute inset-y-0 left-3 w-2 bg-surface-border rounded-full" />

          {/* Niveles como marcas en la barra */}
          {levels.map(lv => {
            const pos = ((lv.price - low) / range) * 100
            const isNearest = lv.label === nearestLevel.label
            return (
              <div
                key={lv.label}
                className="absolute left-0 w-full flex items-center"
                style={{ bottom: `${pos}%`, transform: 'translateY(50%)' }}
              >
                <div className={`w-8 h-0.5 rounded-full ${
                  lv.isGolden ? 'bg-yellow-400' :
                  lv.isKey    ? 'bg-brand' :
                                'bg-surface-border'
                }`} />
              </div>
            )
          })}

          {/* Precio actual */}
          <div
            className="absolute left-0 w-full flex items-center z-10"
            style={{ bottom: `${pricePos}%`, transform: 'translateY(50%)' }}
          >
            <div className="w-8 h-2 bg-white rounded-full shadow-lg shadow-white/20" />
          </div>
        </div>

        {/* Tabla de niveles */}
        <div className="flex-1 flex flex-col justify-between py-0.5 gap-1">
          {[...levels].reverse().map(lv => {
            const isNearest = lv.label === nearestLevel.label
            const isPriceAbove = price >= lv.price
            const textColor = getLevelTextColor(lv.ratio, lv.isGolden)
            const zoneClass = getZoneColor(lv.ratio)

            return (
              <div
                key={lv.label}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg border transition-all ${
                  isNearest
                    ? lv.isGolden
                      ? 'border-yellow-400 bg-yellow-400/15 ring-1 ring-yellow-400/30'
                      : 'border-brand bg-brand/10 ring-1 ring-brand/30'
                    : zoneClass
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold w-12 ${textColor}`}>{lv.label}</span>
                  {lv.isGolden && <span className="text-xs text-yellow-400">✦ Golden</span>}
                  {lv.isKey && !lv.isGolden && <span className="text-xs text-brand">· clave</span>}
                </div>
                <div className="flex items-center gap-3">
                  {isNearest && (
                    <span className="text-xs font-semibold text-white bg-white/10 px-2 py-0.5 rounded-full">
                      ← precio actual
                    </span>
                  )}
                  <span className={`text-xs font-mono font-semibold ${
                    isNearest ? 'text-white' : isPriceAbove ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    ${lv.price.toFixed(2)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Interpretación del nivel más cercano */}
      <div className={`p-4 rounded-xl border ${
        nearestLevel.isGolden
          ? 'bg-yellow-400/10 border-yellow-400/40'
          : nearestLevel.isKey
          ? 'bg-brand/10 border-brand/30'
          : 'bg-surface border-surface-border'
      }`}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-xs font-bold ${nearestLevel.isGolden ? 'text-yellow-400' : nearestLevel.isKey ? 'text-brand' : 'text-gray-400'}`}>
            Nivel {nearestLevel.label} — ${nearestLevel.price.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          {interpretLevel(nearestLevel, entry)}
        </p>
      </div>

      {/* Referencias adicionales en el rango */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Apertura', value: open,  color: 'text-gray-400' },
          { label: 'VWAP',     value: vwap,  color: 'text-brand'    },
          { label: 'Máximo',   value: high,  color: 'text-gain'     },
          { label: 'Mínimo',   value: low,   color: 'text-loss'     },
        ].map(({ label, value, color }) => (
          value != null ? (
            <div key={label} className="flex justify-between items-center px-3 py-2 bg-surface rounded-lg border border-surface-border">
              <span className="text-xs text-gray-500">{label}</span>
              <span className={`text-xs font-mono font-semibold ${color}`}>
                ${(value as number).toFixed(2)}
              </span>
            </div>
          ) : null
        ))}
      </div>

      <p className="text-xs text-gray-700 leading-relaxed">
        Los niveles Fibonacci son zonas de probabilidad, no garantías. Siempre confirmar con volumen y estructura de velas antes de operar.
      </p>
    </div>
  )
}
