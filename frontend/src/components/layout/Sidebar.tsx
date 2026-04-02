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
  LogOut,
} from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/prospecting', label: 'Prospeccao', icon: Search },
  { to: '/queue', label: 'Fila de Aprovacao', icon: InboxIcon },
  { to: '/crm', label: 'CRM Kanban', icon: Kanban },
  { to: '/outreach', label: 'Disparos', icon: Send },
  { to: '/reports', label: 'Relatorios', icon: BarChart3 },
  { to: '/onboarding', label: 'Onboarding', icon: UserCheck },
  { to: '/settings', label: 'Configuracoes', icon: Settings },
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
        'fixed left-0 top-0 h-full bg-[#0d0d14] border-r border-white/[0.06] z-30 flex flex-col transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-100">LocalReach</p>
              <p className="text-xs text-blue-400 font-medium">AI</p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-blue-600/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'p-1 rounded-lg hover:bg-white/10 text-gray-500',
            sidebarCollapsed && 'hidden'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="p-2 mx-auto mt-2 rounded-lg hover:bg-white/10 text-gray-500"
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
      <div className="p-3 border-t border-white/[0.06]">
        {!sidebarCollapsed && user && (
          <div className="mb-2 px-3 py-2">
            <p className="text-sm font-medium text-gray-200 truncate">{user.nome}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-500/15 text-blue-400 rounded-full capitalize">
              {user.plano}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full text-left sidebar-item text-red-400 hover:bg-red-500/10 hover:text-red-300',
            sidebarCollapsed && 'justify-center px-2'
          )}
          title={sidebarCollapsed ? 'Sair' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
