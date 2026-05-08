interface Props {
  score: number
  band: string
  icon: string
  size?: 'sm' | 'md'
}

function scoreColor(score: number): string {
  if (score >= 71) return 'bg-gain'
  if (score >= 51) return 'bg-gain/60'
  if (score >= 31) return 'bg-opportunity'
  return 'bg-gray-600'
}

function scoreTextColor(score: number): string {
  if (score >= 71) return 'text-gain'
  if (score >= 51) return 'text-gain/80'
  if (score >= 31) return 'text-opportunity'
  return 'text-gray-500'
}

export default function ScoreBar({ score, band, icon, size = 'md' }: Props) {
  const barColor = scoreColor(score)
  const textColor = scoreTextColor(score)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold ${textColor} truncate`}>
          {icon} {band}
        </span>
        <span className={`text-xs font-bold ${textColor} shrink-0`}>{score} / 100</span>
      </div>
      <div className="h-1 rounded-full bg-surface-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
