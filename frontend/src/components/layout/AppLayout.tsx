import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { useUIStore } from '@/stores/uiStore'
import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'

export default function AppLayout() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const { showInfo } = useUIStore()
  const user = useAuthStore((s) => s.user)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws?token=${token}`

    try {
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'whatsapp_message') {
            showInfo('Nova mensagem WhatsApp recebida')
          } else if (data.type === 'scraping_complete') {
            showInfo('Scraping concluído!', `${data.leads_saved} leads salvos`)
          } else if (data.type === 'proposal_ready') {
            showInfo('Proposta IA pronta para revisão')
          }
        } catch {
          // ignore parse errors
        }
      }

      wsRef.current.onclose = () => {
        // Reconnect after 5s
        setTimeout(() => {
          wsRef.current = null
        }, 5000)
      }
    } catch {
      // WebSocket not available
    }

    return () => {
      wsRef.current?.close()
    }
  }, [])

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar />
      <div
        className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
