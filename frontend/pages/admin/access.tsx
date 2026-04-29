import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { assetsApi, menuApi, tenantsApi, rolesApi, productConfigApi } from '../../services/api'
import { Plus, Save, RefreshCw, Pencil, Trash2 } from 'lucide-react'

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
type AssetType = { id: number; centerId: number; code: string; name: string; trackingMode: string; isActive: boolean }

export default function AccessControlPage() {
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null
  const isSuperAdmin = currentUser?.username === 'admin' || currentUser?.role === 'SUPER_ADMIN'
  const [centers, setCenters] = useState<Center[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [pages, setPages] = useState<MenuPage[]>([])
  const [roles, setRoles] = useState<{ id: number; name: string; audience: string; isActive: boolean }[]>([])
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([])

  const [centerId, setCenterId] = useState<number | null>(null)
  const [departmentId, setDepartmentId] = useState<number | null>(null) // null => all departments
  const [role, setRole] = useState<string>('Admin')
  const [selectedPageIds, setSelectedPageIds] = useState<number[]>([])
  const [selectedAssetTypeIds, setSelectedAssetTypeIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)
  const [productConfig, setProductConfig] = useState<any>({
    branding: { appName: 'AssetHub', defaultCenterName: 'Bhati Center' },
    sms: { issueEnabled: true, receiveEnabled: true },
    featureFlags: { unifiedAssetsEnabled: true, legacyWirelessEnabled: false, qrAssetFlowEnabled: true },
    centerHeadRoles: [],
    roleDefaults: [],
    assetVisibilityRules: [],
    dashboardWidgets: [],
  })

  const [newCenterName, setNewCenterName] = useState('')
  const [newDeptName, setNewDeptName] = useState('')
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleAudience, setNewRoleAudience] = useState<'Admin' | 'Sewadaar'>('Admin')

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
    const allowedRoles = new Set(['Center Head', 'Admin', 'Sewadaar'])
    const list = (res.data || []).filter((r: any) => r.isActive && allowedRoles.has(r.name))
    setRoles(list)
    if (!role && list.length) setRole(list[0].name)
  }

  const loadAssignment = async (cId: number, dId: number | null, r: string) => {
    const res = await menuApi.getAssignment(cId, dId, r)
    setSelectedPageIds(res.data || [])
  }

  const loadAssetTypes = async (cId: number, dId: number | null) => {
    const res = await assetsApi.getTypes(cId, dId ?? undefined)
    setAssetTypes((res.data || []).filter((x: any) => x.isActive))
  }

  useEffect(() => {
    Promise.all([loadCenters(), loadPages(), loadRoles(), productConfigApi.get().then(r => setProductConfig(r.data))]).catch(() => toast.error('Failed to load access control data'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!centerId) { setDepartments([]); setDepartmentId(null); return }
    loadDepartments(centerId).catch(() => toast.error('Failed to load departments'))
    loadAssetTypes(centerId, null).catch(() => setAssetTypes([]))
    setDepartmentId(null)
  }, [centerId])

  useEffect(() => {
    if (!centerId) { setSelectedPageIds([]); return }
    loadAssignment(centerId, departmentId, role).catch(() => setSelectedPageIds([]))
  }, [centerId, departmentId, role])

  useEffect(() => {
    if (!centerId) { setSelectedAssetTypeIds([]); return }
    const rules = productConfig.assetVisibilityRules || []
    const ids = rules
      .filter((x: any) => x.centerId === centerId && x.role === role && (x.departmentId ?? null) === departmentId)
      .map((x: any) => x.assetTypeId)
    setSelectedAssetTypeIds(ids)
    loadAssetTypes(centerId, departmentId).catch(() => setAssetTypes([]))
  }, [centerId, departmentId, role, productConfig])

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

  const toggleAssetType = (id: number) => {
    setSelectedAssetTypeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
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

  const updateCenter = async () => {
    if (!centerId) return
    const current = centers.find(c => c.id === centerId)
    if (!current) return
    const name = prompt('Edit center name', current.name)
    if (name == null) return
    try {
      await tenantsApi.updateCenter(centerId, { name: name.trim(), isActive: current.isActive })
      toast.success('Center updated')
      await loadCenters()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update center')
    }
  }

  const deleteCenter = async () => {
    if (!centerId) return
    if (!confirm('Delete selected center?')) return
    try {
      await tenantsApi.deleteCenter(centerId)
      toast.success('Center deleted')
      setCenterId(null)
      await loadCenters()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete center')
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

  const updateDepartment = async () => {
    if (!departmentId) { toast.error('Select a department first'); return }
    const current = departments.find(d => d.id === departmentId)
    if (!current) return
    const name = prompt('Edit department name', current.name)
    if (name == null) return
    try {
      await tenantsApi.updateDepartment(departmentId, { name: name.trim(), isActive: current.isActive })
      toast.success('Department updated')
      if (centerId) await loadDepartments(centerId)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update department')
    }
  }

  const deleteDepartment = async () => {
    if (!departmentId) { toast.error('Select a department first'); return }
    if (!confirm('Delete selected department?')) return
    try {
      await tenantsApi.deleteDepartment(departmentId)
      toast.success('Department deleted')
      setDepartmentId(null)
      if (centerId) await loadDepartments(centerId)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete department')
    }
  }

  const createRole = async () => {
    const name = newRoleName.trim()
    if (!name) return
    try {
      await rolesApi.create(name, newRoleAudience as any)
      toast.success('Role created')
      setNewRoleName('')
      await loadRoles()
      setRole(name)
    } catch {
      toast.error('Failed to create role')
    }
  }

  const updateRole = async () => {
    const current = roles.find(r => r.name === role)
    if (!current) return
    const name = prompt('Edit role name', current.name)
    if (name == null) return
    try {
      await rolesApi.update(current.id, { name: name.trim(), audience: current.audience as any, isActive: current.isActive })
      toast.success('Role updated')
      await loadRoles()
      setRole(name.trim())
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update role')
    }
  }

  const deleteRole = async () => {
    const current = roles.find(r => r.name === role)
    if (!current) return
    if (!confirm(`Delete role "${current.name}"?`)) return
    try {
      await rolesApi.delete(current.id)
      toast.success('Role deleted')
      await loadRoles()
      setRole('')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete role')
    }
  }

  const toggleRoleSms = (roleName: string) => {
    setProductConfig((prev: any) => {
      const existing = (prev.roleDefaults || []).find((x: any) => x.role === roleName)
      const roleDefaults = existing
        ? (prev.roleDefaults || []).map((x: any) => x.role === roleName ? { ...x, smsEnabled: !x.smsEnabled } : x)
        : [...(prev.roleDefaults || []), { role: roleName, smsEnabled: false }]
      return { ...prev, roleDefaults }
    })
  }

  const saveConfig = async () => {
    setConfigSaving(true)
    try {
      const otherRules = (productConfig.assetVisibilityRules || []).filter((x: any) => !(x.centerId === centerId && x.role === role && (x.departmentId ?? null) === departmentId))
      const currentRules = selectedAssetTypeIds.map((assetTypeId) => ({ centerId, departmentId, role, assetTypeId }))
      const next = {
        ...productConfig,
        centerHeadRoles: Array.from(new Set(productConfig.centerHeadRoles || [])),
        assetVisibilityRules: [...otherRules, ...currentRules]
      }
      await productConfigApi.update(next)
      setProductConfig(next)
      toast.success('Product configuration saved')
    } catch {
      toast.error('Failed to save product configuration')
    } finally {
      setConfigSaving(false)
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
              <div className="flex gap-2 mt-2">
                <button onClick={updateCenter} className="btn-secondary flex items-center gap-2" disabled={!centerId}>
                  <Pencil size={16} /> Edit
                </button>
                <button onClick={deleteCenter} className="btn-secondary flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50" disabled={!centerId}>
                  <Trash2 size={16} /> Delete
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
              <div className="flex gap-2 mt-2">
                <button onClick={updateDepartment} className="btn-secondary flex items-center gap-2" disabled={!departmentId}>
                  <Pencil size={16} /> Edit
                </button>
                <button onClick={deleteDepartment} className="btn-secondary flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50" disabled={!departmentId}>
                  <Trash2 size={16} /> Delete
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
                  <option value="Sewadaar">Sewadaar UI</option>
                </select>
              </div>
              <button onClick={createRole} className="btn-primary flex items-center gap-2 mt-2 w-full justify-center">
                <Plus size={16} /> Add Role
              </button>
              <div className="flex gap-2 mt-2">
                <button onClick={updateRole} className="btn-secondary flex items-center gap-2 flex-1">
                  <Pencil size={16} /> Edit Role
                </button>
                <button onClick={deleteRole} className="btn-secondary flex items-center gap-2 flex-1 text-red-600 border-red-300 hover:bg-red-50">
                  <Trash2 size={16} /> Delete Role
                </button>
              </div>
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

        <div className="card space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="font-semibold text-gray-800">Asset Visibility Rules</div>
              <div className="text-sm text-gray-500">Choose which asset types the selected role can see for this center/department scope.</div>
            </div>
            <div className="text-sm text-gray-500">Selected asset types: {selectedAssetTypeIds.length}</div>
          </div>
          {!centerId ? (
            <div className="text-sm text-gray-500">Select a center to manage asset visibility.</div>
          ) : assetTypes.length === 0 ? (
            <div className="text-sm text-gray-500">No asset types available for this scope.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {assetTypes.map((t) => (
                <label key={t.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAssetTypeIds.includes(t.id)}
                    onChange={() => toggleAssetType(t.id)}
                    className="mt-1"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800">{t.name}</div>
                    <div className="text-xs text-gray-500 truncate">{t.code} · {t.trackingMode}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <div className="font-semibold text-gray-800">Product Configuration</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!productConfig.sms?.issueEnabled}
                onChange={(e) => setProductConfig((p: any) => ({ ...p, sms: { ...p.sms, issueEnabled: e.target.checked } }))} />
              SMS on Issue Assets
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!productConfig.sms?.receiveEnabled}
                onChange={(e) => setProductConfig((p: any) => ({ ...p, sms: { ...p.sms, receiveEnabled: e.target.checked } }))} />
              SMS on Receive Assets
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!productConfig.featureFlags?.unifiedAssetsEnabled}
                onChange={(e) => setProductConfig((p: any) => ({ ...p, featureFlags: { ...p.featureFlags, unifiedAssetsEnabled: e.target.checked } }))} />
              Unified Assets Module
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!productConfig.featureFlags?.legacyWirelessEnabled}
                onChange={(e) => setProductConfig((p: any) => ({ ...p, featureFlags: { ...p.featureFlags, legacyWirelessEnabled: e.target.checked } }))} />
              Legacy Wireless Module
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!productConfig.featureFlags?.qrAssetFlowEnabled}
                onChange={(e) => setProductConfig((p: any) => ({ ...p, featureFlags: { ...p.featureFlags, qrAssetFlowEnabled: e.target.checked } }))} />
              QR Asset Flow
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">App Name</label>
              <input className="input" value={productConfig.branding?.appName || ''} onChange={(e) => setProductConfig((p: any) => ({ ...p, branding: { ...p.branding, appName: e.target.value } }))} />
            </div>
            <div>
              <label className="label">Default Center Name</label>
              <input className="input" value={productConfig.branding?.defaultCenterName || ''} onChange={(e) => setProductConfig((p: any) => ({ ...p, branding: { ...p.branding, defaultCenterName: e.target.value } }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="label">Center-head roles (cross-department in same center)</div>
              <div className="space-y-1 max-h-40 overflow-auto border rounded-lg p-2">
                {roles.map((r) => {
                  const checked = (productConfig.centerHeadRoles || []).includes(r.name)
                  return (
                    <label key={r.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={checked}
                        onChange={(e) => setProductConfig((p: any) => ({
                          ...p,
                          centerHeadRoles: e.target.checked
                            ? [...(p.centerHeadRoles || []), r.name]
                            : (p.centerHeadRoles || []).filter((x: string) => x !== r.name),
                        }))} />
                      {r.name}
                    </label>
                  )
                })}
              </div>
            </div>
            <div>
              <div className="label">SMS default by role</div>
              <div className="space-y-1 max-h-40 overflow-auto border rounded-lg p-2">
                {roles.map((r) => {
                  const entry = (productConfig.roleDefaults || []).find((x: any) => x.role === r.name)
                  const smsEnabled = entry ? !!entry.smsEnabled : true
                  return (
                    <label key={r.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={smsEnabled} onChange={() => toggleRoleSms(r.name)} />
                      {r.name} ({smsEnabled ? 'SMS ON' : 'SMS OFF'})
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          <button onClick={saveConfig} disabled={configSaving || !isSuperAdmin} className="btn-primary w-full md:w-auto">
            {configSaving ? 'Saving config...' : 'Save Product Config'}
          </button>
          {!isSuperAdmin && <div className="text-xs text-amber-700">Only SUPER_ADMIN can change product configuration.</div>}
        </div>
      </div>
    </AdminLayout>
  )
}
