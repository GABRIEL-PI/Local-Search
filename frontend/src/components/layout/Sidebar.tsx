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
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/app/prospecting', label: 'Prospecção', icon: Search },
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
        'fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-30 flex flex-col transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">LocalReach</p>
              <p className="text-xs text-blue-600 font-medium">AI</p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
            <Zap className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'p-1 rounded-lg hover:bg-gray-100 text-gray-500',
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
          className="p-2 mx-auto mt-2 rounded-lg hover:bg-gray-100 text-gray-500"
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
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-gray-200">
        {!sidebarCollapsed && user && (
          <div className="mb-2 px-3 py-2">
            <p className="text-sm font-medium text-gray-900 truncate">{user.nome}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full capitalize">
              {user.plano}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full text-left sidebar-item text-red-500 hover:bg-red-50 hover:text-red-600',
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
