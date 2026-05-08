type Risk = 'bajo' | 'medio' | 'medio-alto' | 'alto'

const RISK_CLASSES: Record<Risk, string> = {
  bajo: 'text-gain text-xs bg-gain-bg px-2 py-0.5 rounded-full',
  medio: 'text-opportunity text-xs bg-opportunity-bg px-2 py-0.5 rounded-full',
  'medio-alto': 'text-orange-400 text-xs bg-orange-400/10 px-2 py-0.5 rounded-full',
  alto: 'text-loss text-xs bg-loss-bg px-2 py-0.5 rounded-full',
}

export default function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <span className={RISK_CLASSES[risk] ?? RISK_CLASSES['medio']}>
      {risk}
    </span>
  )
}
