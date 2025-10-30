// src/api.js
import axios from 'axios'

// Ajusta si tu backend usa otro host/puerto
const API_BASE = 'http://127.0.0.1:8000/api'

export const tokens = {
  get access()  { return localStorage.getItem('access') || '' },
  get refresh() { return localStorage.getItem('refresh') || '' },
  set(a, r)     { localStorage.setItem('access', a); localStorage.setItem('refresh', r) },
  clear()       { localStorage.removeItem('access'); localStorage.removeItem('refresh') },
}

const API = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Adjunta token automáticamente
API.interceptors.request.use((config) => {
  const acc = tokens.access
  if (acc) config.headers.Authorization = `Bearer ${acc}`
  return config
})

// Refresh automático ante 401
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry && tokens.refresh) {
      original._retry = true
      try {
        const { data } = await axios.post(`${API_BASE}/seguridad/auth/refresh`, { refresh: tokens.refresh })
        tokens.set(data.access, tokens.refresh)
        original.headers.Authorization = `Bearer ${data.access}`
        return axios(original)
      } catch {
        tokens.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// ---------- AUTH ----------
export async function login(username, password) {
  const { data } = await axios.post(`${API_BASE}/seguridad/auth/login`, { username, password })
  tokens.set(data.access, data.refresh)
  return data
}
export function logout() { tokens.clear() }

// ---------- TUS ENDPOINTS ----------
export const getHistogram = (dimension, bins, n) =>
  API.get('/charts/histogram/', { params: { dimension, bins, n } })

export const getXBarR = (dimension, group_size, n) =>
  API.get('/charts/xbar-r/', { params: { dimension, group_size, n } })

export const getCapability = (dimension, lsl, usl, n) =>
  API.get('/metrics/capability/', { params: { dimension, lsl, usl, n } })

export default API
