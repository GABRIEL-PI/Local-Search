import { create } from 'zustand'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
}

interface UIState {
  sidebarCollapsed: boolean
  toasts: Toast[]

  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  toasts: [],

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed: boolean) =>
    set({ sidebarCollapsed: collapsed }),

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
