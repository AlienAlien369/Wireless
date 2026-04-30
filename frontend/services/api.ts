import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// Public API instance — no JWT attached.
// Used by the /set/[number] QR landing page which must work without login.
const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  forgotPassword: (identifier: string) =>
    api.post('/auth/forgot-password', { identifier }),
  resetPassword: (identifier: string, otp: string, newPassword: string) =>
    api.post('/auth/reset-password', { identifier, otp, newPassword }),
}

// ─── Visits ──────────────────────────────────────────────────────────────────
export const visitsApi = {
  getAll: (params?: { centerId?: number; departmentId?: number }) => api.get('/visits', { params }),
  getById: (id: number) => api.get(`/visits/${id}`),
  create: (data: any) => api.post('/visits', data),
  update: (id: number, data: any) => api.put(`/visits/${id}`, data),
  delete: (id: number) => api.delete(`/visits/${id}`),
}

// ─── Incharges ───────────────────────────────────────────────────────────────
export const sewadaarsApi = {
  getAll: () => api.get('/sewadaars'),
  getById: (id: number) => api.get(`/sewadaars/${id}`),
  getByBadge: (badge: string) => api.get(`/sewadaars/badge/${badge}`),
  create: (data: any) => api.post('/sewadaars', data),
  update: (id: number, data: any) => api.put(`/sewadaars/${id}`, data),
  delete: (id: number) => api.delete(`/sewadaars/${id}`),
}
export const inchargesApi = sewadaarsApi

// ─── Inventory ───────────────────────────────────────────────────────────────
export const inventoryApi = {
  getSets: (params?: { brand?: string; status?: string }) =>
    api.get('/inventory/wireless-sets', { params }),
  getSetByNumber: (number: string) =>
    api.get(`/inventory/wireless-sets/by-number/${number}`),
  createSet: (data: any) => api.post('/inventory/wireless-sets', data),
  updateSet: (id: number, data: any) => api.put(`/inventory/wireless-sets/${id}`, data),
  deleteSet: (id: number) => api.delete(`/inventory/wireless-sets/${id}`),

  getChargers: (brand?: string) => api.get('/inventory/chargers', { params: { brand } }),
  createCharger: (data: any) => api.post('/inventory/chargers', data),
  deleteCharger: (id: number) => api.delete(`/inventory/chargers/${id}`),

  getKits: () => api.get('/inventory/kits'),
  createKit: (data: any) => api.post('/inventory/kits', data),
  deleteKit: (id: number) => api.delete(`/inventory/kits/${id}`),
  // Unauthenticated lookup — used by the public /set/[number] landing page.
  getSetByNumberPublic: (number: string) => publicApi.get(`/inventory/wireless-sets/by-number/${number}`),
}

// ─── Issues ──────────────────────────────────────────────────────────────────
export const issuesApi = {
  getByVisit: (visitId: number) => api.get(`/issues/visit/${visitId}`),
  getById: (id: number) => api.get(`/issues/${id}`),
  getByIncharge: (inchargeId: number) => api.get(`/issues/incharge/${inchargeId}`),
  create: (data: any) => api.post('/issues', data),
  return: (id: number, itemIds: number[]) => api.post(`/issues/${id}/return`, itemIds),
  uploadPhoto: (id: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/issues/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

// ─── Breakages ───────────────────────────────────────────────────────────────
export const breakagesApi = {
  getAll: (visitId?: number) => api.get('/breakages', { params: { visitId } }),
  create: (data: any) => api.post('/breakages', data),
  delete: (id: number) => api.delete(`/breakages/${id}`),
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportsApi = {
  getDashboard: (params?: { centerId?: number; departmentId?: number }) => api.get('/reports/dashboard', { params }),
  getVisitWiseDashboard: (params?: { centerId?: number; departmentId?: number }) => api.get('/reports/visit-wise', { params }),
  visitExcel: (visitId: number) =>
    api.get(`/reports/visit/${visitId}/excel`, { responseType: 'blob' }),
  inventoryExcel: () =>
    api.get('/reports/inventory/excel', { responseType: 'blob' }),
  breakagesPdf: (visitId?: number) =>
    api.get('/reports/breakages/pdf', { params: { visitId }, responseType: 'blob' }),
}

// â”€â”€â”€ Tenancy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const tenantsApi = {
  getCenters: () => api.get('/tenants/centers'),
  createCenter: (name: string) => api.post('/tenants/centers', { name }),
  updateCenter: (id: number, data: { name: string; isActive: boolean }) => api.put(`/tenants/centers/${id}`, data),
  deleteCenter: (id: number) => api.delete(`/tenants/centers/${id}`),
  getDepartments: (centerId?: number) => api.get('/tenants/departments', { params: { centerId } }),
  createDepartment: (centerId: number, name: string) => api.post('/tenants/departments', { centerId, name }),
  updateDepartment: (id: number, data: { name: string; isActive: boolean }) => api.put(`/tenants/departments/${id}`, data),
  deleteDepartment: (id: number) => api.delete(`/tenants/departments/${id}`),
}

// â”€â”€â”€ Menu â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const menuApi = {
  getMy: () => api.get('/menu/my'),
  getPages: () => api.get('/menu/pages'),
  getAssignment: (centerId: number, departmentId: number | null, role: string) =>
    api.get('/menu/assignments', { params: { centerId, departmentId, role } }),
  upsertAssignment: (data: { centerId: number; departmentId: number | null; role: string; menuPageIds: number[] }) =>
    api.put('/menu/assignments', data),
}

export const rolesApi = {
  getAll: () => api.get('/roles'),
  create: (name: string, audience: 'Admin' | 'Sewadaar') => api.post('/roles', { name, audience }),
  update: (id: number, data: { name: string; audience: 'Admin' | 'Sewadaar'; isActive: boolean }) => api.put(`/roles/${id}`, data),
  delete: (id: number) => api.delete(`/roles/${id}`),
}

export const usersApi = {
  getAll: (params?: { centerId?: number; departmentId?: number; role?: string }) => api.get('/users', { params }),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  setPassword: (id: string, newPassword: string) => api.post(`/users/${id}/set-password`, { newPassword }),
}

export const assetsApi = {
  getTypes: (centerId?: number, departmentId?: number, forSetup?: boolean) => api.get('/assets/types', { params: { centerId, departmentId, forSetup } }),
  createType: (data: any) => api.post('/assets/types', data),
  updateType: (id: number, data: any) => api.put(`/assets/types/${id}`, data),
  deleteType: (id: number) => api.delete(`/assets/types/${id}`),
  getAssets: (centerId: number, assetTypeId?: number, status?: string, departmentId?: number) =>
    api.get('/assets', { params: { centerId, assetTypeId, status, departmentId } }),
  createAsset: (data: any) => api.post('/assets', data),
  updateAsset: (id: number, data: any) => api.put(`/assets/${id}`, data),
  deleteAsset: (id: number) => api.delete(`/assets/${id}`),
  getQr: (id: number) => api.get(`/assets/${id}/qr`),
  // Authenticated scan — used by the manual QR input on issue-assets page.
  scanQr: (qrValue: string) => api.get(`/assets/scan/${encodeURIComponent(qrValue)}`),
  // Unauthenticated scan — used by the public /set/[number] landing page.
  scanQrPublic: (qrValue: string) => publicApi.get(`/assets/scan/${encodeURIComponent(qrValue)}`),
}

export const productConfigApi = {
  get: () => api.get('/productconfig'),
  update: (data: any) => api.put('/productconfig', data),
}

export default api
