import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  InboxIcon,
  Kanban,
  FileText,
  BarChart3,
  Settings,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Zap,
  Send,
  Sparkles,
  Building2,
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/app/prospecting', label: 'Prospecção', icon: Search },
  { to: '/app/prospecting-v2', label: 'Prospecção v2', icon: Sparkles, beta: true },
  { to: '/app/prospecting-receita', label: 'Prospecção Receita', icon: Building2, beta: true },
  { to: '/app/queue', label: 'Fila de Aprovação', icon: InboxIcon },
  { to: '/app/crm', label: 'CRM Kanban', icon: Kanban },
  { to: '/app/outreach', label: 'Disparos', icon: Send },
  { to: '/app/reports', label: 'Relatórios', icon: BarChart3 },
  { to: '/app/onboarding', label: 'Onboarding', icon: UserCheck },
  { to: '/app/settings', label: 'Configurações', icon: Settings },
]

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-bg border-r border-border z-30 flex flex-col transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-fg rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-bg" />
            </div>
            <div>
              <p className="text-sm font-bold text-fg">LocalReach</p>
              <p className="text-xs text-fg-faint font-medium">AI</p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 bg-fg rounded-lg flex items-center justify-center mx-auto">
            <Zap className="w-5 h-5 text-bg" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'p-1 rounded-lg hover:bg-surface text-fg-faint hover:text-fg transition-colors',
            sidebarCollapsed && 'hidden'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Toggle when collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="p-2 mx-auto mt-2 rounded-lg hover:bg-surface text-fg-faint hover:text-fg transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                'sidebar-item',
                isActive && 'active',
                sidebarCollapsed && 'justify-center px-2'
              )
            }
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="flex items-center gap-1.5">
                {item.label}
                {item.beta && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30 rounded uppercase tracking-wide">
                    beta
                  </span>
                )}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border">
        {!sidebarCollapsed && user && (
          <div className="mb-2 px-3 py-2">
            <p className="text-sm font-medium text-fg truncate">{user.nome}</p>
            <p className="text-xs text-fg-faint truncate">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 rounded-full capitalize">
              {user.plano}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full text-left sidebar-item text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-700 dark:text-red-300',
            sidebarCollapsed && 'justify-center px-2'
          )}
          title={sidebarCollapsed ? 'Sair' : undefined}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!sidebarCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
