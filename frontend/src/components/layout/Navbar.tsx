import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, X, Sun, Moon } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { leadsApi } from '@/lib/api'
import { Lead } from '@/types'

export default function Navbar() {
  const user = useAuthStore((s) => s.user)
  const { theme, toggleTheme } = useUIStore()
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
    <header className="h-16 bg-bg border-b border-border flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-faint" />
          <input
            type="text"
            placeholder="Buscar leads, propostas..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="pl-9 pr-8 py-2 text-sm bg-surface border border-border text-fg placeholder:text-fg-faint rounded-lg w-72 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setResults([]); setShowResults(false) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-faint hover:text-fg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface rounded-lg shadow-2xl border border-border z-50 max-h-80 overflow-y-auto">
              {searching ? (
                <div className="p-4 text-center text-sm text-fg-faint">Buscando...</div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-sm text-fg-faint">Nenhum resultado</div>
              ) : (
                results.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => goToLead(lead.id)}
                    className="w-full text-left px-4 py-3 hover:bg-elevated border-b border-border last:border-b-0 transition-colors"
                  >
                    <p className="text-sm font-medium text-fg">{lead.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {lead.categoria && <span className="text-xs text-fg-subtle">{lead.categoria}</span>}
                      {lead.cidade && <span className="text-xs text-fg-faint">{lead.cidade}</span>}
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Score: {lead.lead_score}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          className="relative p-2 text-fg-faint hover:text-fg hover:bg-surface rounded-lg transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button className="relative p-2 text-fg-faint hover:text-fg hover:bg-surface rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-elevated border border-border-strong rounded-full flex items-center justify-center text-fg text-sm font-medium">
            {user?.nome?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-fg">{user?.nome}</p>
            <p className="text-xs text-fg-faint capitalize">{user?.plano}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
