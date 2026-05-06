import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,        // Required for Sanctum SPA cookies
  withXSRFToken: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

// Fetch CSRF cookie before first mutating request
let csrfInitialized = false

async function ensureCsrf() {
  if (!csrfInitialized) {
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true })
    csrfInitialized = true
  }
}

// Request interceptor – ensure CSRF for mutations
api.interceptors.request.use(async (config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method ?? '')) {
    await ensureCsrf()
  }
  return config
})

// Response interceptor – handle 401 (redirect to login)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state and redirect
      csrfInitialized = false
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Typed response envelope
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: Record<string, string[]>
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    summary?: Record<string, unknown>
  }
}
