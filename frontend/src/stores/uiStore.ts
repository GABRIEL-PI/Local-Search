import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
}

interface UIState {
  sidebarCollapsed: boolean
  toasts: Toast[]
  theme: Theme

  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem('theme') as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  toasts: [],
  theme: getInitialTheme(),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed: boolean) =>
    set({ sidebarCollapsed: collapsed }),

  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    applyTheme(theme)
    set({ theme })
  },

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', next)
    applyTheme(next)
    set({ theme: next })
  },

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2)
    const newToast = { ...toast, id }
    set((state) => ({ toasts: [...state.toasts, newToast] }))
    setTimeout(() => get().removeToast(id), 5000)
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  showSuccess: (title, message) =>
    get().addToast({ type: 'success', title, message }),

  showError: (title, message) =>
    get().addToast({ type: 'error', title, message }),

  showWarning: (title, message) =>
    get().addToast({ type: 'warning', title, message }),

  showInfo: (title, message) =>
    get().addToast({ type: 'info', title, message }),
}))

if (typeof document !== 'undefined') {
  applyTheme(getInitialTheme())
}
