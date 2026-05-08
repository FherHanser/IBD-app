import { BACKEND_URL } from '../config'

const BASE = `${BACKEND_URL}/api`

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
  alerts: () => get<any>('/alerts'),
  stockDetail: (symbol: string) => get<any>(`/stocks/${symbol}`),
  watchlist: () => get<any>('/watchlist'),
  addToWatchlist: (symbol: string) =>
    fetch(`${BASE}/watchlist/${symbol}`, { method: 'POST' }).then(r => r.json()),
  removeFromWatchlist: (symbol: string) =>
    fetch(`${BASE}/watchlist/${symbol}`, { method: 'DELETE' }).then(r => r.json()),
}
