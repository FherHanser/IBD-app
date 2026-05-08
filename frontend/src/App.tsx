import { useMarketWebSocket } from './hooks/useWebSocket'
import Dashboard from './components/Dashboard'

export default function App() {
  const { data, status } = useMarketWebSocket()
  return <Dashboard data={data} wsStatus={status} />
}
