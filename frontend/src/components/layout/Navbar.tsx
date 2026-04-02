import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, X } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { leadsApi } from '@/lib/api'
import { Lead } from '@/types'

export default function Navbar() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<Lead[]>([])
  const [showResults, setShowResults] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (value.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    timeoutRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await leadsApi.list({ search: value, limit: 8 })
        setResults(res.data.items || [])
        setShowResults(true)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  const goToLead = (id: number) => {
    setShowResults(false)
    setSearchTerm('')
    navigate(`/leads/${id}`)
  }

  return (
    <header className="h-16 bg-[#0d0d14]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="pl-9 pr-8 py-2 text-sm bg-white/5 border border-white/10 rounded-xl w-72 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 placeholder:text-gray-500"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setResults([]); setShowResults(false) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#12121a] rounded-xl shadow-2xl border border-white/[0.06] z-50 max-h-80 overflow-y-auto">
              {searching ? (
                <div className="p-4 text-center text-sm text-gray-500">Buscando...</div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">Nenhum resultado</div>
              ) : (
                results.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => goToLead(lead.id)}
                    className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/[0.04] last:border-b-0 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-200">{lead.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {lead.categoria && <span className="text-xs text-gray-500">{lead.categoria}</span>}
                      {lead.cidade && <span className="text-xs text-gray-600">{lead.cidade}</span>}
                      <span className="text-xs text-blue-400 font-medium">Score: {lead.lead_score}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {user?.nome?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-200">{user?.nome}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.plano}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
