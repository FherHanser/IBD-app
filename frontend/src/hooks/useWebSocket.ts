import { useEffect, useRef, useState, useCallback } from 'react'
import { MarketState } from '../types'
import { WS_URL } from '../config'

const RECONNECT_DELAY_MS = 3000

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export function useMarketWebSocket() {
  const [data, setData] = useState<MarketState | null>(null)
  const [status, setStatus] = useState<WsStatus>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMounted = useRef(true)

  const connect = useCallback(() => {
    if (!isMounted.current) return

    setStatus('connecting')
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      if (!isMounted.current) return
      setStatus('connected')
      // Ping periódico para mantener la conexión viva
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping')
      }, 20_000)
      ;(ws as any)._pingInterval = pingInterval
    }

    ws.onmessage = (event) => {
      if (!isMounted.current) return
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'market_update') {
          setData(msg as MarketState)
        }
      } catch {
        // ignorar mensajes mal formados
      }
    }

    ws.onerror = () => {
      if (!isMounted.current) return
      setStatus('error')
    }

    ws.onclose = () => {
      if (!isMounted.current) return
      clearInterval((ws as any)._pingInterval)
      setStatus('disconnected')
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS)
    }
  }, [])

  useEffect(() => {
    isMounted.current = true
    connect()
    return () => {
      isMounted.current = false
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { data, status }
}
