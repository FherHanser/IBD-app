import { X, TrendingUp, TrendingDown, Target, Activity, BarChart2, Zap, AlertTriangle, Info } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function HelpModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 bg-surface-card border-b border-surface-border flex items-center justify-between px-6 py-4 rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <Info size={18} className="text-brand" />
            <h2 className="text-base font-bold text-white">Cómo leer el tablero</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-8">

          {/* Aviso general */}
          <div className="flex gap-3 p-4 bg-opportunity-bg border border-opportunity/30 rounded-xl">
            <AlertTriangle size={16} className="text-opportunity shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300 leading-relaxed">
              Este tablero es una <strong className="text-white">herramienta de análisis</strong>, no un sistema de recomendaciones de compra garantizadas.
              Cada señal debe validarse con tu propio criterio antes de operar. El mercado siempre tiene el control final.
            </p>
          </div>

          {/* Las tres secciones */}
          <Section icon={<TrendingUp size={16} className="text-gain" />} title="Top Ganadoras" color="text-gain">
            <p>Muestra las <strong>10 acciones que más subieron en porcentaje</strong> durante la sesión.</p>
            <ul className="list-none flex flex-col gap-1.5 mt-2">
              <Li>Una acción aquí <em>no significa que debas comprarla</em>. Si ya subió mucho, el riesgo de entrada tardía es alto.</Li>
              <Li>Busca las que suben con <strong>volumen alto</strong> (Vol &gt; 1.5x) — eso confirma interés real.</Li>
              <Li>Si la señal dice "Sube con volumen bajo. Posible trampa" → mucho cuidado.</Li>
              <Li>Si el RSI supera 70 y la acción ya subió más de 8% → <strong>no perseguir</strong>. Esperar retroceso.</Li>
            </ul>
          </Section>

          <Section icon={<TrendingDown size={16} className="text-loss" />} title="Top Perdedoras" color="text-loss">
            <p>Muestra las <strong>10 acciones con mayor caída porcentual</strong> en el día.</p>
            <ul className="list-none flex flex-col gap-1.5 mt-2">
              <Li>Una acción que cae <strong>no es automáticamente una oportunidad</strong>. Puede seguir cayendo.</Li>
              <Li>Caídas &gt; 15% generalmente indican noticia negativa fuerte — evitar hasta que se estabilice.</Li>
              <Li>Si aparece en <em>ambas</em> secciones (perdedoras y tentación de compra) → el sistema detectó señales técnicas de posible rebote.</Li>
              <Li>Busca que el precio <strong>deje de hacer mínimos nuevos</strong> antes de considerar cualquier entrada.</Li>
            </ul>
          </Section>

          <Section icon={<Target size={16} className="text-opportunity" />} title="Tentación de Compra" color="text-opportunity">
            <p>Las acciones aquí tienen el <strong>score de oportunidad más alto</strong>. No significa "comprar ya" — significa "merece tu atención".</p>
            <ul className="list-none flex flex-col gap-1.5 mt-2">
              <Li>El sistema detectó una combinación favorable de caída, volumen, RSI y recuperación de VWAP.</Li>
              <Li>Siempre confirmar: que el precio <strong>deje de caer</strong>, que recupere VWAP y que el volumen comprador aumente.</Li>
              <Li>Score ≥ 71 con señal verde → revisión inmediata con riesgo controlado.</Li>
              <Li>Los ETFs (SPY, QQQ, etc.) están excluidos de esta sección — solo acciones individuales.</Li>
            </ul>
          </Section>

          {/* Indicadores en las cards */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Activity size={15} className="text-brand" />
              Qué significa cada dato en las tarjetas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <IndicatorCard
                label="Vol 1.8x"
                color="text-gain"
                what="Volumen relativo"
                how="El volumen actual vs el promedio histórico. 1.8x = está operando 80% más que lo normal."
                interpret={[
                  "> 2x: volumen muy alto, confirma el movimiento",
                  "1.0x – 1.5x: volumen normal",
                  "< 1x: movimiento débil, desconfiar",
                ]}
              />
              <IndicatorCard
                label="RSI 42"
                color="text-gray-300"
                what="Relative Strength Index (0-100)"
                how="Mide si una acción está sobrecomprada o sobrevendida en los últimos 14 períodos."
                interpret={[
                  "< 30: sobreventa fuerte → posible rebote",
                  "30 – 45: zona de oportunidad ideal",
                  "45 – 60: neutral",
                  "> 70: sobrecomprada → no comprar",
                ]}
              />
              <IndicatorCard
                label="▲ VWAP"
                color="text-gain"
                what="Volume Weighted Average Price"
                how="El precio promedio del día ponderado por volumen. Es la referencia que usan los institucionales."
                interpret={[
                  "▲ VWAP (verde): precio sobre VWAP → control comprador",
                  "▼ VWAP (gris): precio bajo VWAP → control vendedor",
                  "Recuperar VWAP = primera señal de rebote",
                ]}
              />
              <IndicatorCard
                label="Tendencia"
                color="text-gray-300"
                what="Alineación de medias móviles EMA 9/20/50"
                how="Indica si la tendencia principal de la acción es alcista o bajista."
                interpret={[
                  "alcista: EMA9 > EMA20 > EMA50 → tendencia sana",
                  "alcista parcial: solo EMA9 > EMA20",
                  "bajista: estructura rota, más riesgo",
                  "neutral: sin dirección clara",
                ]}
              />
            </div>
          </div>

          {/* Score 0-100 */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <BarChart2 size={15} className="text-brand" />
              Score de Oportunidad (0 – 100)
            </h3>
            <p className="text-xs text-gray-400 mb-3">Solo visible en la sección Tentación de Compra. Se calcula con 6 factores:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { factor: "Tendencia general", pct: "20%", desc: "EMAs alineadas al alza" },
                { factor: "Retroceso saludable", pct: "20%", desc: "Caída entre 3% y 15%" },
                { factor: "Volumen comprador", pct: "20%", desc: "Vol relativo > 1.5x" },
                { factor: "RSI en zona", pct: "15%", desc: "RSI entre 30 y 50" },
                { factor: "Recuperación VWAP", pct: "15%", desc: "Precio cerca o sobre VWAP" },
                { factor: "Riesgo por caída", pct: "10%", desc: "Penaliza caídas extremas" },
              ].map(({ factor, pct, desc }) => (
                <div key={factor} className="flex items-start gap-2 p-2.5 bg-surface rounded-lg border border-surface-border">
                  <span className="text-xs font-bold text-brand shrink-0 w-8">{pct}</span>
                  <div>
                    <p className="text-xs font-semibold text-white">{factor}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { range: "0 – 30", label: "Sin señal", icon: "⚫", color: "text-gray-500" },
                { range: "31 – 50", label: "Vigilar", icon: "🟡", color: "text-opportunity" },
                { range: "51 – 70", label: "Interesante", icon: "🟢", color: "text-gain/70" },
                { range: "71 – 100", label: "Alta oportunidad", icon: "🟢", color: "text-gain" },
              ].map(({ range, label, icon, color }) => (
                <div key={range} className="text-center p-2 bg-surface rounded-lg border border-surface-border">
                  <div className="text-base mb-0.5">{icon}</div>
                  <div className={`text-xs font-bold ${color}`}>{label}</div>
                  <div className="text-xs text-gray-600">{range}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Señales */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Zap size={15} className="text-brand" />
              Señales textuales — qué hacer con cada una
            </h3>
            <div className="flex flex-col gap-2">
              {[
                {
                  text: "Señal interesante. Revisar con riesgo controlado.",
                  color: "text-gain",
                  bg: "bg-gain-bg border-gain/20",
                  action: "El sistema detectó buenas condiciones técnicas. Revisa el gráfico, define tu stop loss y tamaño de posición antes de entrar.",
                },
                {
                  text: "Condiciones técnicas favorables. Esperar confirmación.",
                  color: "text-gain/70",
                  bg: "bg-gain/5 border-gain/10",
                  action: "Hay señales positivas pero no todas confirmadas. Esperar que el precio rompa resistencia o recupere VWAP con volumen.",
                },
                {
                  text: "No perseguir precio. Esperar retroceso.",
                  color: "text-opportunity",
                  bg: "bg-opportunity-bg border-opportunity/20",
                  action: "La acción ya subió demasiado rápido. Entrar aquí es arriesgado. Esperar un pullback a la EMA o VWAP.",
                },
                {
                  text: "Sube con volumen bajo. Posible trampa. Vigilar volumen.",
                  color: "text-opportunity",
                  bg: "bg-opportunity-bg border-opportunity/20",
                  action: "Subida sin respaldo de volumen puede revertirse. Esperar confirmación de volumen antes de considerar entrada.",
                },
                {
                  text: "Caída fuerte haciendo mínimos nuevos. Alto riesgo.",
                  color: "text-loss",
                  bg: "bg-loss-bg border-loss/20",
                  action: "No entrar. La acción sigue en caída libre. Esperar que deje de hacer mínimos y muestre volumen comprador.",
                },
                {
                  text: "Caída extrema. Evitar entrada hasta nueva confirmación.",
                  color: "text-loss",
                  bg: "bg-loss-bg border-loss/20",
                  action: "Probable noticia negativa fuerte. Máximo riesgo. Solo vigilar desde afuera hasta que el polvo se asiente.",
                },
              ].map(({ text, color, bg, action }) => (
                <div key={text} className={`p-3 rounded-lg border ${bg}`}>
                  <p className={`text-xs font-semibold ${color} mb-1`}>"{text}"</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Riesgo */}
          <div>
            <h3 className="text-sm font-bold text-white mb-3">Niveles de riesgo</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "bajo", color: "text-gain", bg: "bg-gain-bg border-gain/20", desc: "Caída moderada, sin señales de alarma" },
                { label: "medio", color: "text-opportunity", bg: "bg-opportunity-bg border-opportunity/20", desc: "Caída entre 5-8%, vigilar evolución" },
                { label: "medio-alto", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20", desc: "Caída > 8% o volumen extremo" },
                { label: "alto", color: "text-loss", bg: "bg-loss-bg border-loss/20", desc: "Caída > 15% o haciendo mínimos" },
              ].map(({ label, color, bg, desc }) => (
                <div key={label} className={`p-3 rounded-lg border ${bg}`}>
                  <span className={`text-xs font-bold ${color}`}>{label}</span>
                  <p className="text-xs text-gray-500 mt-1 leading-snug">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Regla de oro */}
          <div className="p-4 bg-brand/10 border border-brand/30 rounded-xl">
            <p className="text-xs font-bold text-brand mb-1">Regla de oro del sistema</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              Una señal verde con score alto es un <strong className="text-white">punto de partida para investigar</strong>, no una orden de compra.
              Siempre define cuánto estás dispuesto a perder antes de cuánto quieres ganar.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, color, children }: {
  icon: React.ReactNode
  title: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className={`text-sm font-bold mb-2 flex items-center gap-2 ${color}`}>
        {icon} {title}
      </h3>
      <div className="text-xs text-gray-400 leading-relaxed">{children}</div>
    </div>
  )
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-brand shrink-0 mt-0.5">›</span>
      <span>{children}</span>
    </li>
  )
}

function IndicatorCard({ label, color, what, how, interpret }: {
  label: string
  color: string
  what: string
  how: string
  interpret: string[]
}) {
  return (
    <div className="p-3 bg-surface rounded-lg border border-surface-border flex flex-col gap-1.5">
      <span className={`text-sm font-bold font-mono ${color}`}>{label}</span>
      <p className="text-xs font-semibold text-white">{what}</p>
      <p className="text-xs text-gray-500 leading-snug">{how}</p>
      <ul className="flex flex-col gap-0.5 mt-1">
        {interpret.map((line) => (
          <li key={line} className="text-xs text-gray-400 flex gap-1.5">
            <span className="text-brand shrink-0">·</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
