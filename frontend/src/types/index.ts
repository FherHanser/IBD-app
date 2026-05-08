export interface TradeLevels {
  entry: number
  stop: number
  target1: number
  target2: number
  risk_dollar: number
  risk_pct: number
  rr1: number
  rr2: number
  direction: 'long' | 'short'
}

export interface SignalAge {
  minutes_ago: number
  signal_price: number
  move_since_pct: number
}

export interface StockEntry {
  symbol: string
  name: string
  price: number
  open: number
  high: number
  low: number
  change_pct: number
  change_dollar: number
  volume: number
  volume_relative: number
  dollar_volume: number | null
  // Contexto diario
  gap_pct: number | null
  prev_close: number | null
  prev_high: number | null
  prev_low: number | null
  // Indicadores
  rsi: number | null
  vwap: number | null
  vwap_upper1: number | null
  vwap_lower1: number | null
  vwap_upper2: number | null
  vwap_lower2: number | null
  ema9: number | null
  ema20: number | null
  ema_trend: 'alcista' | 'alcista_parcial' | 'bajista' | 'bajista_parcial' | 'neutral'
  macd_hist: number | null
  above_vwap: boolean | null
  pct_from_vwap: number | null
  making_new_lows: boolean
  atr: number | null
  atr_ratio: number | null
  range_pct: number | null
  // Score
  score: number
  score_band: string
  score_icon: string
  risk: 'bajo' | 'medio' | 'medio-alto' | 'alto'
  score_reasons: string[]
  // Señal
  signal: string
  signal_type: 'buy_watch' | 'caution' | 'danger' | 'info'
  // Setup técnico
  setup_key: string
  setup_label: string
  setup_confidence: string
  setup_reason: string
  // Niveles de trade
  trade_levels: TradeLevels | null
  // Edad de señal
  signal_age: SignalAge | null
  // Fuerza relativa
  rs_spy: number | null
  rs_qqq: number | null
  // Z-Score intraday
  z_score: number | null
}

export interface Alert {
  symbol: string
  price: number
  type: 'gainer_alert' | 'loser_alert' | 'opportunity_alert'
  severity: 'high' | 'medium' | 'low'
  message: string
  timestamp: string
}

export interface MarketSession {
  session: 'pre_market' | 'market' | 'after_hours' | 'closed'
  label: string
  is_active: boolean
  time_et: string
  date: string
}

export interface MarketState {
  type: string
  last_update: string | null
  market_session: MarketSession
  gainers: StockEntry[]
  losers: StockEntry[]
  opp_low: StockEntry[]
  opp_mid: StockEntry[]
  opp_top: StockEntry[]
  alerts: Alert[]
  total_processed: number
  status: string
}
