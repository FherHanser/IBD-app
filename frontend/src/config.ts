// En producción (GitHub Pages): VITE_BACKEND_URL apunta al backend en Render
// En desarrollo local: usa window.location.hostname:8000
const raw = import.meta.env.VITE_BACKEND_URL ?? `http://${window.location.hostname}:8000`

export const BACKEND_URL = raw
export const WS_URL = raw.replace(/^http/, 'ws') + '/ws/market'
