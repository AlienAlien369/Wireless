import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { menuApi, tenantsApi, rolesApi } from '../../services/api'
import { Plus, Save, RefreshCw } from 'lucide-react'

type Center = { id: number; name: string; isActive: boolean }
type Department = { id: number; centerId: number; name: string; isActive: boolean }
type MenuPage = {
  id: number
  code: string
  label: string
  path: string
  icon: string
  audience: string
  sortOrder: number
  isActive: boolean
}

export default function AccessControlPage() {
  const [centers, setCenters] = useState<Center[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [pages, setPages] = useState<MenuPage[]>([])
  const [roles, setRoles] = useState<{ id: number; name: string; audience: string; isActive: boolean }[]>([])

  const [centerId, setCenterId] = useState<number | null>(null)
  const [departmentId, setDepartmentId] = useState<number | null>(null) // null => all departments
  const [role, setRole] = useState<string>('Admin')
  const [selectedPageIds, setSelectedPageIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  const [newCenterName, setNewCenterName] = useState('')
  const [newDeptName, setNewDeptName] = useState('')
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleAudience, setNewRoleAudience] = useState<'Admin' | 'Incharge'>('Admin')

  const loadCenters = async () => {
    const res = await tenantsApi.getCenters()
    setCenters(res.data || [])
    const stored = JSON.parse(localStorage.getItem('user') || 'null')
    const preferred = stored?.centerId
    if (!centerId && preferred) setCenterId(preferred)
    else if (!centerId && res.data?.length) setCenterId(res.data[0].id)
  }

  const loadDepartments = async (cId: number) => {
    const res = await tenantsApi.getDepartments(cId)
    setDepartments(res.data || [])
  }

  const loadPages = async () => {
    const res = await menuApi.getPages()
    setPages(res.data || [])
  }

  const loadRoles = async () => {
    const res = await rolesApi.getAll()
    const list = (res.data || []).filter((r: any) => r.isActive)
    setRoles(list)
    if (!role && list.length) setRole(list[0].name)
  }

  const loadAssignment = async (cId: number, dId: number | null, r: string) => {
    const res = await menuApi.getAssignment(cId, dId, r)
    setSelectedPageIds(res.data || [])
  }

  useEffect(() => {
    Promise.all([loadCenters(), loadPages(), loadRoles()]).catch(() => toast.error('Failed to load access control data'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!centerId) { setDepartments([]); setDepartmentId(null); return }
    loadDepartments(centerId).catch(() => toast.error('Failed to load departments'))
    setDepartmentId(null)
  }, [centerId])

  useEffect(() => {
    if (!centerId) { setSelectedPageIds([]); return }
    loadAssignment(centerId, departmentId, role).catch(() => setSelectedPageIds([]))
  }, [centerId, departmentId, role])

  const visiblePages = useMemo(() => {
    const selectedRole = roles.find(r => r.name === role)
    const audience = selectedRole?.audience || 'Admin'
    return pages
      .filter(p => p.isActive && p.audience === audience)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [pages, role, roles])

  const togglePage = (id: number) => {
    setSelectedPageIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const save = async () => {
    if (!centerId) { toast.error('Select a center first'); return }
    setSaving(true)
    try {
      await menuApi.upsertAssignment({ centerId, departmentId, role, menuPageIds: selectedPageIds })
      toast.success('Access rules saved')
    } catch {
      toast.error('Failed to save access rules')
    } finally {
      setSaving(false)
    }
  }

  const createCenter = async () => {
    const name = newCenterName.trim()
    if (!name) return
    try {
      const res = await tenantsApi.createCenter(name)
      toast.success('Center created')
      setNewCenterName('')
      await loadCenters()
      setCenterId(res.data.id)
    } catch {
      toast.error('Failed to create center')
    }
  }

  const createDepartment = async () => {
    if (!centerId) { toast.error('Select a center first'); return }
    const name = newDeptName.trim()
    if (!name) return
    try {
      await tenantsApi.createDepartment(centerId, name)
      toast.success('Department created')
      setNewDeptName('')
      await loadDepartments(centerId)
    } catch {
      toast.error('Failed to create department')
    }
  }

  const createRole = async () => {
    const name = newRoleName.trim()
    if (!name) return
    try {
      await rolesApi.create(name, newRoleAudience)
      toast.success('Role created')
      setNewRoleName('')
      await loadRoles()
      setRole(name)
    } catch {
      toast.error('Failed to create role')
    }
  }

  return (
    <AdminLayout title="Access Control">
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="font-semibold text-gray-800">Assign menu pages by tenant scope</div>
              <div className="text-sm text-gray-500">Rules are applied by Center, Department (optional), and Role.</div>
            </div>
            <button onClick={() => centerId && loadAssignment(centerId, departmentId, role)}
              className="btn-secondary flex items-center gap-2">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card space-y-3">
            <div>
              <label className="label">Center</label>
              <select className="input" value={centerId ?? ''} onChange={(e) => setCenterId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Select center...</option>
                {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex gap-2 mt-2">
                <input className="input" placeholder="New center name" value={newCenterName} onChange={(e) => setNewCenterName(e.target.value)} />
                <button onClick={createCenter} className="btn-primary flex items-center gap-2 whitespace-nowrap">
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>

            <div>
              <label className="label">Department</label>
              <select className="input" value={departmentId ?? ''} onChange={(e) => setDepartmentId(e.target.value === '' ? null : Number(e.target.value))}>
                <option value="">All departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <div className="flex gap-2 mt-2">
                <input className="input" placeholder="New department name" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} />
                <button onClick={createDepartment} className="btn-primary flex items-center gap-2 whitespace-nowrap" disabled={!centerId}>
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>

            <div>
              <label className="label">Role</label>
              <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input className="input" placeholder="New role name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} />
                <select className="input" value={newRoleAudience} onChange={(e) => setNewRoleAudience(e.target.value as any)}>
                  <option value="Admin">Admin UI</option>
                  <option value="Incharge">Incharge UI</option>
                </select>
              </div>
              <button onClick={createRole} className="btn-primary flex items-center gap-2 mt-2 w-full justify-center">
                <Plus size={16} /> Add Role
              </button>
            </div>

            <button onClick={save} className="btn-primary flex items-center justify-center gap-2" disabled={saving || !centerId}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Rules'}
            </button>

            <div className="text-xs text-gray-500">
              Tip: Use “All departments” to define center-wide defaults, then override per-department if needed.
            </div>
          </div>

          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <div>
                <div className="font-semibold text-gray-800">Pages</div>
                <div className="text-sm text-gray-500">{visiblePages.length} pages available for {role}</div>
              </div>
              <div className="text-sm text-gray-500">
                Selected: <span className="font-medium text-gray-800">{selectedPageIds.length}</span>
              </div>
            </div>

            {!centerId ? (
              <div className="text-sm text-gray-500">Select a center to manage access rules.</div>
            ) : visiblePages.length === 0 ? (
              <div className="text-sm text-gray-500">No pages available for this role.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {visiblePages.map(p => (
                  <label key={p.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPageIds.includes(p.id)}
                      onChange={() => togglePage(p.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800">{p.label}</div>
                      <div className="text-xs text-gray-500 truncate">{p.path}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
