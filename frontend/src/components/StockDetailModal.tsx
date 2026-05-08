import { X, BarChart2, Activity, Target, Clock, TrendingUp } from 'lucide-react'
import { StockEntry } from '../types'
import ScoreBar from './ScoreBar'
import RiskBadge from './RiskBadge'
import FibonacciAnalysis from './FibonacciAnalysis'

interface Props {
  entry: StockEntry
  onClose: () => void
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

export default function StockDetailModal({ entry, onClose }: Props) {
  const isPositive = entry.change_pct >= 0
  const changeColor = isPositive ? 'text-gain' : 'text-loss'
  const signalColor = SIGNAL_COLORS[entry.signal_type] ?? 'text-gray-400'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[92vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-surface-card border-b border-surface-border px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{entry.symbol}</span>
                <span className={`text-lg font-bold ${changeColor}`}>
                  {isPositive ? '+' : ''}{entry.change_pct.toFixed(2)}%
                </span>
                {entry.gap_pct !== null && entry.gap_pct !== undefined && Math.abs(entry.gap_pct) >= 0.5 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${entry.gap_pct > 0 ? 'text-gain bg-gain/10' : 'text-loss bg-loss/10'}`}>
                    Gap {entry.gap_pct > 0 ? '+' : ''}{entry.gap_pct.toFixed(1)}%
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">{entry.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold font-mono text-white">${entry.price.toFixed(2)}</span>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-3 sm:px-6 py-4 sm:py-5 flex flex-col gap-4 sm:gap-6">

          {/* Señal + score */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 p-3 bg-surface rounded-xl border border-surface-border">
              <p className="text-xs text-gray-500 mb-1">Señal</p>
              <p className={`text-sm font-semibold ${signalColor}`}>{entry.signal}</p>
            </div>
            <div className="sm:w-52 p-3 bg-surface rounded-xl border border-surface-border">
              <p className="text-xs text-gray-500 mb-2">Score de oportunidad</p>
              <ScoreBar score={entry.score} band={entry.score_band} icon={entry.score_icon} />
            </div>
          </div>

          {/* Setup técnico */}
          {entry.setup_key !== 'undefined' && (
            <div className="p-3 bg-surface rounded-xl border border-surface-border">
              <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                <TrendingUp size={11} /> Setup técnico
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-bold ${CONFIDENCE_COLORS[entry.setup_confidence] ?? 'text-gray-300'}`}>
                  {entry.setup_label}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CONFIDENCE_COLORS[entry.setup_confidence] ?? 'text-gray-500'} bg-surface-border`}>
                  confianza {entry.setup_confidence}
                </span>
              </div>
              {entry.setup_reason && (
                <p className="text-xs text-gray-500 mt-1">{entry.setup_reason}</p>
              )}
            </div>
          )}

          {/* Señal — edad y movimiento */}
          {entry.signal_age && (
            <div className="p-3 bg-surface rounded-xl border border-surface-border">
              <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                <Clock size={11} /> Señal activa
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                <span className="text-gray-300">
                  Hace <strong className="text-white">{entry.signal_age.minutes_ago} min</strong>
                </span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-300">
                  Precio entrada <strong className="font-mono text-white">${entry.signal_age.signal_price.toFixed(2)}</strong>
                </span>
                <span className="text-gray-500">·</span>
                <span className={entry.signal_age.move_since_pct >= 0 ? 'text-gain' : 'text-loss'}>
                  {entry.signal_age.move_since_pct >= 0 ? '+' : ''}{entry.signal_age.move_since_pct.toFixed(2)}% desde señal
                </span>
              </div>
            </div>
          )}

          {/* Niveles de trade */}
          {entry.trade_levels && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Target size={12} /> Niveles de trade (ATR)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="px-3 py-2 bg-surface rounded-lg border border-brand/30">
                  <p className="text-xs text-gray-500">Entrada</p>
                  <p className="text-sm font-bold font-mono text-brand">${entry.trade_levels.entry.toFixed(2)}</p>
                </div>
                <div className="px-3 py-2 bg-surface rounded-lg border border-loss/30">
                  <p className="text-xs text-gray-500">Stop loss</p>
                  <p className="text-sm font-bold font-mono text-loss">${entry.trade_levels.stop.toFixed(2)}</p>
                  <p className="text-xs text-gray-600">−{entry.trade_levels.risk_pct.toFixed(2)}% · ${entry.trade_levels.risk_dollar.toFixed(2)}</p>
                </div>
                <div className="px-3 py-2 bg-surface rounded-lg border border-gain/20">
                  <p className="text-xs text-gray-500">Objetivo 1</p>
                  <p className="text-sm font-bold font-mono text-gain">${entry.trade_levels.target1.toFixed(2)}</p>
                  <p className="text-xs text-gray-600">R:R {entry.trade_levels.rr1}:1</p>
                </div>
                <div className="px-3 py-2 bg-surface rounded-lg border border-gain/20">
                  <p className="text-xs text-gray-500">Objetivo 2</p>
                  <p className="text-sm font-bold font-mono text-gain">${entry.trade_levels.target2.toFixed(2)}</p>
                  <p className="text-xs text-gray-600">R:R {entry.trade_levels.rr2}:1</p>
                </div>
              </div>
            </div>
          )}

          {/* Métricas del día */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity size={12} /> Datos del día
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: 'Apertura',  value: `$${entry.open.toFixed(2)}`,           color: 'text-gray-300' },
                { label: 'Máximo',    value: `$${entry.high.toFixed(2)}`,            color: 'text-gain'     },
                { label: 'Mínimo',    value: `$${entry.low.toFixed(2)}`,             color: 'text-loss'     },
                { label: 'Cambio $',  value: `${isPositive ? '+' : ''}$${entry.change_dollar.toFixed(2)}`, color: changeColor },
                { label: 'Volumen',   value: formatVolume(entry.volume),             color: 'text-gray-300' },
                { label: 'Vol Rel',   value: `${entry.volume_relative.toFixed(1)}x`, color: entry.volume_relative >= 1.5 ? 'text-gain' : 'text-gray-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="px-3 py-2 bg-surface rounded-lg border border-surface-border">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`text-sm font-bold font-mono ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contexto día anterior */}
          {(entry.prev_close || entry.gap_pct !== null) && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Contexto día anterior
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {entry.prev_close && (
                  <div className="px-3 py-2 bg-surface rounded-lg border border-surface-border">
                    <p className="text-xs text-gray-500">Cierre ant.</p>
                    <p className="text-sm font-bold font-mono text-gray-300">${entry.prev_close.toFixed(2)}</p>
                  </div>
                )}
                {entry.prev_high && (
                  <div className="px-3 py-2 bg-surface rounded-lg border border-surface-border">
                    <p className="text-xs text-gray-500">Máx. ant.</p>
                    <p className="text-sm font-bold font-mono text-gray-400">${entry.prev_high.toFixed(2)}</p>
                  </div>
                )}
                {entry.prev_low && (
                  <div className="px-3 py-2 bg-surface rounded-lg border border-surface-border">
                    <p className="text-xs text-gray-500">Mín. ant.</p>
                    <p className="text-sm font-bold font-mono text-gray-400">${entry.prev_low.toFixed(2)}</p>
                  </div>
                )}
                {entry.gap_pct !== null && entry.gap_pct !== undefined && (
                  <div className="px-3 py-2 bg-surface rounded-lg border border-surface-border">
                    <p className="text-xs text-gray-500">Gap apertura</p>
                    <p className={`text-sm font-bold font-mono ${entry.gap_pct > 0 ? 'text-gain' : entry.gap_pct < 0 ? 'text-loss' : 'text-gray-400'}`}>
                      {entry.gap_pct > 0 ? '+' : ''}{entry.gap_pct.toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fuerza relativa */}
          {(entry.rs_spy !== null || entry.rs_qqq !== null) && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Fuerza relativa
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {entry.rs_spy !== null && (
                  <div className="px-3 py-2 bg-surface rounded-lg border border-surface-border">
                    <p className="text-xs text-gray-500">vs SPY</p>
                    <p className={`text-sm font-bold font-mono ${entry.rs_spy > 0 ? 'text-gain' : 'text-loss'}`}>
                      {entry.rs_spy > 0 ? '+' : ''}{entry.rs_spy.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-600">
                      {entry.rs_spy > 2 ? 'Supera claramente al mercado' :
                       entry.rs_spy > 0 ? 'Levemente mejor que mercado' :
                       entry.rs_spy > -2 ? 'Levemente peor que mercado' :
                       'Rezagado vs mercado'}
                    </p>
                  </div>
                )}
                {entry.rs_qqq !== null && (
                  <div className="px-3 py-2 bg-surface rounded-lg border border-surface-border">
                    <p className="text-xs text-gray-500">vs QQQ</p>
                    <p className={`text-sm font-bold font-mono ${entry.rs_qqq > 0 ? 'text-gain' : 'text-loss'}`}>
                      {entry.rs_qqq > 0 ? '+' : ''}{entry.rs_qqq.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-600">
                      {entry.rs_qqq > 2 ? 'Supera claramente al Nasdaq' :
                       entry.rs_qqq > 0 ? 'Levemente mejor que Nasdaq' :
                       entry.rs_qqq > -2 ? 'Levemente peor que Nasdaq' :
                       'Rezagado vs Nasdaq'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Indicadores técnicos */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <BarChart2 size={12} /> Indicadores técnicos
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <IndicatorRow
                label="RSI 14"
                value={entry.rsi?.toFixed(0) ?? '—'}
                color={!entry.rsi ? 'text-gray-500' : entry.rsi < 30 ? 'text-gain' : entry.rsi > 70 ? 'text-loss' : 'text-gray-300'}
                note={
                  !entry.rsi ? '' :
                  entry.rsi < 30 ? 'Sobreventa fuerte' :
                  entry.rsi < 45 ? 'Zona de oportunidad' :
                  entry.rsi > 70 ? 'Sobrecomprado' :
                  'Zona neutral'
                }
              />
              <IndicatorRow
                label="VWAP"
                value={entry.vwap ? `$${entry.vwap.toFixed(2)}` : '—'}
                color={entry.above_vwap === true ? 'text-gain' : entry.above_vwap === false ? 'text-loss' : 'text-gray-500'}
                note={
                  entry.above_vwap === true  ? `+${entry.pct_from_vwap?.toFixed(2)}% sobre VWAP` :
                  entry.above_vwap === false ? `${entry.pct_from_vwap?.toFixed(2)}% bajo VWAP` :
                  ''
                }
              />
              <IndicatorRow
                label="EMA 9"
                value={entry.ema9 ? `$${entry.ema9.toFixed(2)}` : '—'}
                color={entry.price > (entry.ema9 ?? 0) ? 'text-gain' : 'text-loss'}
                note={entry.ema9 ? (entry.price > entry.ema9 ? 'Precio sobre EMA9' : 'Precio bajo EMA9') : ''}
              />
              <IndicatorRow
                label="EMA 20"
                value={entry.ema20 ? `$${entry.ema20.toFixed(2)}` : '—'}
                color={entry.price > (entry.ema20 ?? 0) ? 'text-gain' : 'text-loss'}
                note={entry.ema20 ? (entry.price > entry.ema20 ? 'Precio sobre EMA20' : 'Precio bajo EMA20') : ''}
              />
              <IndicatorRow
                label="Tendencia EMA"
                value={entry.ema_trend.replace('_', ' ')}
                color={
                  entry.ema_trend === 'alcista'         ? 'text-gain' :
                  entry.ema_trend === 'alcista_parcial' ? 'text-gain/70' :
                  entry.ema_trend === 'bajista'         ? 'text-loss' :
                  'text-gray-400'
                }
                note=""
              />
              <IndicatorRow
                label="Riesgo"
                value={entry.risk}
                color={
                  entry.risk === 'bajo'      ? 'text-gain' :
                  entry.risk === 'medio'     ? 'text-opportunity' :
                  entry.risk === 'medio-alto'? 'text-orange-400' :
                  'text-loss'
                }
                note=""
              />
              {entry.atr && (
                <IndicatorRow
                  label="ATR 14"
                  value={`$${entry.atr.toFixed(2)}`}
                  color="text-gray-300"
                  note={entry.atr_ratio ? `Rango día ${entry.atr_ratio.toFixed(1)}× ATR` : ''}
                />
              )}
              {entry.range_pct && (
                <IndicatorRow
                  label="Rango día"
                  value={`${entry.range_pct.toFixed(2)}%`}
                  color={entry.range_pct > 5 ? 'text-opportunity' : 'text-gray-300'}
                  note={entry.range_pct > 5 ? 'Día volátil' : ''}
                />
              )}
            </div>
          </div>

          {/* Bandas VWAP */}
          {entry.vwap && (entry.vwap_upper1 || entry.vwap_lower1) && (
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Bandas VWAP
              </h3>
              <VwapBands entry={entry} />
            </div>
          )}

          {/* Razones del score */}
          {entry.score_reasons.length > 0 && (
            <div className="p-3 bg-surface rounded-xl border border-surface-border">
              <p className="text-xs text-gray-500 mb-1.5">Por qué tiene este score</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.score_reasons.map((r) => (
                  <span
                    key={r}
                    title={REASON_TOOLTIPS[r] ?? REASON_TOOLTIPS[_matchReason(r)] ?? ''}
                    className="text-xs text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full cursor-help"
                  >
                    {r}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">Pasa el cursor sobre cada etiqueta para más detalle.</p>
            </div>
          )}

          {/* Fibonacci */}
          <div className="border-t border-surface-border pt-5">
            <FibonacciAnalysis entry={entry} />
          </div>

        </div>
      </div>
    </div>
  )
}

const REASON_TOOLTIPS: Record<string, string> = {
  'tendencia alcista confirmada':   'EMA9 > EMA20 > EMA50 alineadas al alza. Las tres medias móviles confirman una tendencia compradora sólida. +20 puntos al score.',
  'tendencia alcista parcial':      'EMA9 > EMA20 pero sin EMA50 alineada. Tendencia positiva de corto plazo, no completamente confirmada. +12 puntos al score.',
  'volumen muy alto':               'Volumen ≥ 2.5× su promedio. Hay interés institucional o catalizador importante. Movimientos con este volumen tienden a tener continuación. +20 puntos.',
  'volumen elevado':                'Volumen entre 1.5× y 2.5× su promedio. Participación por encima de lo normal, señal positiva de interés comprador. +15 puntos.',
  'precio cerca de VWAP':           'El precio está dentro del ±1% del VWAP. Zona de equilibrio precio-volumen del día — ideal para entradas de menor riesgo. +15 puntos.',
  'precio bajo VWAP, acercándose':  'El precio está entre 1% y 3% bajo el VWAP. Se está acercando a la zona de equilibrio. Si rompe el VWAP con volumen, es señal positiva. +10 puntos.',
  'precio sobre VWAP':              'El precio cotiza entre 1% y 3% sobre el VWAP. El mercado valúa la acción por encima del precio promedio ponderado del día. +10 puntos.',
  'haciendo mínimos nuevos':        'El precio marcó un nuevo mínimo del día recientemente. Señal de debilidad — aumenta el riesgo de la posición. Penaliza el score.',
  'caída extrema, riesgo muy alto': 'La acción cayó más del 15% en el día. Riesgo de entrada muy alto. El score de riesgo se elimina completamente. Evitar entrada.',
}

function _matchReason(r: string): string {
  if (r.startsWith('retroceso saludable'))   return 'retroceso saludable'
  if (r.startsWith('retroceso fuerte'))      return 'retroceso fuerte'
  if (r.startsWith('RSI en sobreventa moderada')) return 'RSI en sobreventa moderada'
  if (r.startsWith('RSI en sobreventa fuerte'))   return 'RSI en sobreventa fuerte'
  return r
}

const REASON_TOOLTIPS_DYNAMIC: Record<string, string> = {
  'retroceso saludable':        'La acción retrocedió entre 3% y 12% desde apertura — zona óptima para buscar entrada. Sugiere corrección sana dentro de tendencia. +20 puntos.',
  'retroceso fuerte':           'Caída entre 12% y 15% desde apertura. Retroceso más agresivo de lo ideal — mayor riesgo, pero puede haber oportunidad si hay soporte. +10 puntos.',
  'RSI en sobreventa moderada': 'RSI entre 30 y 45. Zona técnica de sobreventa moderada donde los vendedores se agotan y aumenta la probabilidad de rebote. +15 puntos.',
  'RSI en sobreventa fuerte':   'RSI por debajo de 30. Sobreventa extrema. Históricamente, estos niveles preceden rebotes técnicos. Requiere confirmación con volumen. +12 puntos.',
}

Object.assign(REASON_TOOLTIPS, REASON_TOOLTIPS_DYNAMIC)

function VwapBands({ entry }: { entry: StockEntry }) {
  const levels = [
    { label: 'VWAP +2σ', value: entry.vwap_upper2, color: 'text-loss' },
    { label: 'VWAP +1σ', value: entry.vwap_upper1, color: 'text-loss/70' },
    { label: 'VWAP',     value: entry.vwap,        color: 'text-brand' },
    { label: 'VWAP −1σ', value: entry.vwap_lower1, color: 'text-gain/70' },
    { label: 'VWAP −2σ', value: entry.vwap_lower2, color: 'text-gain' },
  ].filter(l => l.value !== null && l.value !== undefined) as { label: string; value: number; color: string }[]

  if (!levels.length) return null

  return (
    <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
      {levels.map(({ label, value, color }) => {
        const isCurrent = entry.price >= value * 0.999 && entry.price <= value * 1.001
        return (
          <div
            key={label}
            className={`px-3 py-2 bg-surface rounded-lg border ${isCurrent ? 'border-brand' : 'border-surface-border'}`}
          >
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-sm font-bold font-mono ${color}`}>${value.toFixed(2)}</p>
            {isCurrent && <p className="text-xs text-brand mt-0.5">← precio actual</p>}
          </div>
        )
      })}
    </div>
  )
}

function IndicatorRow({ label, value, color, note }: {
  label: string; value: string; color: string; note: string
}) {
  return (
    <div className="px-3 py-2 bg-surface rounded-lg border border-surface-border">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm font-bold font-mono ${color}`}>{value}</p>
      {note && <p className="text-xs text-gray-600 mt-0.5">{note}</p>}
    </div>
  )
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000)     return `${(vol / 1_000).toFixed(0)}K`
  return vol.toString()
}
