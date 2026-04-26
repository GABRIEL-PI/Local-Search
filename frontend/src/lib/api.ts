import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor - attach access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
let isRefreshing = false
let failedQueue: Array<{ resolve: (value: string) => void; reject: (error: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config

    const status = error.response?.status
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const { access_token, refresh_token } = response.data
        localStorage.setItem('access_token', access_token)
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token)
        }

        api.defaults.headers.common.Authorization = `Bearer ${access_token}`
        processQueue(null, access_token)

        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// Auth endpoints
export const authApi = {
  login: (email: string, senha: string) =>
    api.post('/auth/login', { email, senha }),
  register: (nome: string, email: string, senha: string) =>
    api.post('/auth/register', { nome, email, senha }),
  refresh: (refresh_token: string) =>
    api.post('/auth/refresh', { refresh_token }),
  logout: () => api.post('/auth/logout'),
  getPendingUsers: () => api.get('/auth/pending-users'),
  approveUser: (userId: number) => api.post(`/auth/approve-user/${userId}`),
  rejectUser: (userId: number) => api.delete(`/auth/reject-user/${userId}`),
}

// Leads endpoints
export const leadsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/leads', { params }),
  create: (data: Record<string, unknown>) =>
    api.post('/leads', data),
  get: (id: number) =>
    api.get(`/leads/${id}`),
  updateStatus: (id: number, status: string, observacao?: string) =>
    api.put(`/leads/${id}/status`, { status, observacao }),
  delete: (id: number) =>
    api.delete(`/leads/${id}`),
  scrape: (data: { cidade: string; estado?: string; categoria: string; limite: number }) =>
    api.post('/leads/scrape', data),
  scrapeBatch: (data: {
    cidades: string[]
    estado?: string
    categorias: string[]
    limite: number
    min_rating?: number
    only_no_website?: boolean
  }) => api.post('/leads/scrape-batch', data),
  getNotes: (id: number) =>
    api.get(`/leads/${id}/notes`),
  addNote: (id: number, conteudo: string) =>
    api.post(`/leads/${id}/notes`, { conteudo }),
  assignTags: (id: number, tag_ids: number[]) =>
    api.post(`/leads/${id}/tags`, { tag_ids }),
  getDashboardStats: () =>
    api.get('/leads/dashboard-stats'),
  getDashboardExtra: () =>
    api.get('/leads/dashboard-extra'),
  getScrapingSessions: () =>
    api.get('/leads/scraping-sessions'),
}

// Proposals endpoints
export const proposalsApi = {
  generate: (lead_id: number) =>
    api.post('/proposals/generate', { lead_id }),
  get: (id: number) =>
    api.get(`/proposals/${id}`),
  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/proposals/${id}`, data),
  approve: (id: number) =>
    api.put(`/proposals/${id}/approve`),
  reject: (id: number) =>
    api.put(`/proposals/${id}/reject`),
  getQueue: () =>
    api.get('/proposals/queue'),
}

// Outreach endpoints
export const outreachApi = {
  getQueue: () =>
    api.get('/outreach/queue'),
  send: (data: Record<string, unknown>) =>
    api.post('/outreach/send', data),
  get: (id: number) =>
    api.get(`/outreach/${id}`),
}

// Reports endpoints
export const reportsApi = {
  getFunnel: () =>
    api.get('/reports/funnel'),
  getRevenue: () =>
    api.get('/reports/revenue'),
  getPerformance: () =>
    api.get('/reports/performance'),
}

// Geogrid endpoints
export const geogridApi = {
  start: (data: {
    lead_id: number
    keyword?: string
    grid_size?: number
    spacing_meters?: number
    zoom?: number
    radius?: number
  }) => api.post('/geogrid/start', data),
  list: () => api.get('/geogrid'),
  byLead: (lead_id: number) => api.get(`/geogrid/by-lead/${lead_id}`),
  get: (id: number) => api.get(`/geogrid/${id}`),
}

// Settings endpoints
export const settingsApi = {
  get: () =>
    api.get('/settings'),
  update: (data: Record<string, unknown>) =>
    api.put('/settings', data),
  getWhatsAppAccounts: () =>
    api.get('/settings/whatsapp/accounts'),
  createWhatsAppAccount: (data: { nome: string; instancia_id: string }) =>
    api.post('/settings/whatsapp/accounts', data),
}

export default api
