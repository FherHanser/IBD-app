const BACKEND_HOST = window.location.hostname
const BASE = `http://${BACKEND_HOST}:8000/api`

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

export const api = {
  health: () => get<{ status: string }>('/health'),
  marketStatus: () => get<any>('/market/status'),
  gainers: () => get<any>('/stocks/gainers'),
  losers: () => get<any>('/stocks/losers'),
  opportunities: () => get<any>('/stocks/opportunities'),
  alerts: () => get<any>('/alerts'),
  stockDetail: (symbol: string) => get<any>(`/stocks/${symbol}`),
  watchlist: () => get<any>('/watchlist'),
  addToWatchlist: (symbol: string) =>
    fetch(`${BASE}/watchlist/${symbol}`, { method: 'POST' }).then(r => r.json()),
  removeFromWatchlist: (symbol: string) =>
    fetch(`${BASE}/watchlist/${symbol}`, { method: 'DELETE' }).then(r => r.json()),
}
