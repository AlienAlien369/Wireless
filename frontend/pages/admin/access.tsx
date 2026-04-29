import { useEffect, useMemo, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { assetsApi, menuApi, tenantsApi, rolesApi, productConfigApi } from '../../services/api'
import { Plus, Save, RefreshCw, Pencil, Trash2, ChevronRight, Shield, Building2, Users, Eye, Settings, LayoutGrid } from 'lucide-react'

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
  const [departmentId, setDepartmentId] = useState<number | null>(null)
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
    const res = await assetsApi.getTypes(cId, dId ?? undefined, true)
    setAssetTypes((res.data || []).filter((x: any) => x.isActive))
  }

  useEffect(() => {
    Promise.all([loadCenters(), loadPages(), loadRoles(), productConfigApi.get().then(r => setProductConfig(r.data))]).catch(() => toast.error('Failed to load access control data'))
  }, [])

  useEffect(() => {
    if (!centerId) { setDepartments([]); setDepartmentId(null); return }
    loadDepartments(centerId).catch(() => toast.error('Failed to load departments'))
    loadAssetTypes(centerId, null).catch(() => setAssetTypes([]))
    setDepartmentId(null)
  }, [centerId])

  useEffect(() => {
    if (!centerId) { setSelectedPageIds([]); setAssetTypes([]); return }
    loadAssignment(centerId, departmentId, role).catch(() => setSelectedPageIds([]))
    loadAssetTypes(centerId, departmentId).catch(() => setAssetTypes([]))
  }, [centerId, departmentId, role])

  useEffect(() => {
    if (!centerId) { setSelectedAssetTypeIds([]); return }
    const rules = productConfig.assetVisibilityRules || []
    const ids = rules
      .filter((x: any) => x.centerId === centerId && x.role === role && (x.departmentId ?? null) === departmentId)
      .map((x: any) => x.assetTypeId)
    setSelectedAssetTypeIds(ids)
  }, [centerId, departmentId, role, productConfig])

  const availableRoles = useMemo(() => {
    const active = roles.filter(r => r.isActive)
    if (departmentId === null || departmentId === undefined) {
      return active.filter(r => r.name === 'Center Head')
    }
    return active.filter(r => r.name === 'Admin' || r.name === 'Sewadaar')
  }, [departmentId, roles])

  useEffect(() => {
    if (availableRoles.length === 0) return
    const validNames = availableRoles.map(r => r.name)
    if (!role || !validNames.includes(role)) {
      setRole(availableRoles[0].name)
    }
  }, [availableRoles])

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

  // Breadcrumb summary of current scope
  const scopeSummary = [
    centers.find(c => c.id === centerId)?.name,
    departmentId ? departments.find(d => d.id === departmentId)?.name : 'All Departments',
    role,
  ].filter(Boolean)

  return (
    <AdminLayout title="Access Control">
      <div className="space-y-6">

        {/* ── HEADER STRIP ── */}
        <div className="card">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="font-semibold text-gray-800 text-base">Access Control</div>
              <div className="text-sm text-gray-500 mt-0.5">Assign menu pages and asset visibility by Center → Department → Role</div>
              {scopeSummary.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {scopeSummary.map((s, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5 font-medium">{s}</span>
                      {i < scopeSummary.length - 1 && <ChevronRight size={12} className="text-gray-300" />}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => centerId && loadAssignment(centerId, departmentId, role)}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        {/* ── STEP 1: SCOPE SELECTOR ── */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
            <div className="font-semibold text-gray-800">Select Scope</div>
            <div className="text-sm text-gray-400">— Choose center, department and role to configure access for</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CENTER */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-gray-400" />
                <label className="label mb-0 text-sm font-semibold">Center</label>
              </div>
              <select className="input" value={centerId ?? ''} onChange={(e) => setCenterId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Select center…</option>
                {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex gap-2">
                <input className="input flex-1 min-w-0" placeholder="New center name" value={newCenterName} onChange={(e) => setNewCenterName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createCenter()} />
                <button onClick={createCenter} className="btn-primary flex items-center gap-1 whitespace-nowrap px-3">
                  <Plus size={14} />
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={updateCenter} className="btn-secondary flex items-center gap-1.5 flex-1 justify-center text-xs" disabled={!centerId}>
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={deleteCenter} className="btn-secondary flex items-center gap-1.5 flex-1 justify-center text-xs text-red-600 border-red-300 hover:bg-red-50" disabled={!centerId}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>

            {/* DEPARTMENT */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <LayoutGrid size={15} className="text-gray-400" />
                <label className="label mb-0 text-sm font-semibold">Department</label>
              </div>
              <select className="input" value={departmentId ?? ''} onChange={(e) => setDepartmentId(e.target.value === '' ? null : Number(e.target.value))}>
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <div className={`text-xs rounded-lg px-2.5 py-1.5 ${departmentId ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                {departmentId ? '✓ Admin & Sewadaar roles available' : '⚠ Center Head role only'}
              </div>
              <div className="flex gap-2">
                <input className="input flex-1 min-w-0" placeholder="New department" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createDepartment()} disabled={!centerId} />
                <button onClick={createDepartment} className="btn-primary flex items-center gap-1 px-3" disabled={!centerId}>
                  <Plus size={14} />
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={updateDepartment} className="btn-secondary flex items-center gap-1.5 flex-1 justify-center text-xs" disabled={!departmentId}>
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={deleteDepartment} className="btn-secondary flex items-center gap-1.5 flex-1 justify-center text-xs text-red-600 border-red-300 hover:bg-red-50" disabled={!departmentId}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>

            {/* ROLE */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-gray-400" />
                <label className="label mb-0 text-sm font-semibold">Role</label>
              </div>
              <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                {availableRoles.length === 0
                  ? <option value="">— Select center & department first —</option>
                  : availableRoles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)
                }
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input className="input" placeholder="New role name" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} />
                <select className="input" value={newRoleAudience} onChange={(e) => setNewRoleAudience(e.target.value as any)}>
                  <option value="Admin">Admin UI</option>
                  <option value="Sewadaar">Sewadaar UI</option>
                </select>
              </div>
              <button onClick={createRole} className="btn-primary flex items-center gap-1.5 w-full justify-center text-sm">
                <Plus size={14} /> Add Role
              </button>
              <div className="flex gap-2">
                <button onClick={updateRole} className="btn-secondary flex items-center gap-1.5 flex-1 justify-center text-xs">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={deleteRole} className="btn-secondary flex items-center gap-1.5 flex-1 justify-center text-xs text-red-600 border-red-300 hover:bg-red-50">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── STEP 2: PAGE ACCESS + ASSET VISIBILITY (side by side) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* PAGE ACCESS */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <div>
                <div className="font-semibold text-gray-800">Page Access</div>
                <div className="text-sm text-gray-500">{visiblePages.length} pages for <span className="font-medium text-gray-700">{role || '—'}</span></div>
              </div>
              <div className="ml-auto">
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 font-medium">
                  {selectedPageIds.length} / {visiblePages.length} selected
                </span>
              </div>
            </div>

            {!centerId ? (
              <div className="text-sm text-gray-400 text-center py-8 border border-dashed border-gray-200 rounded-xl">
                Select a center to manage page access
              </div>
            ) : visiblePages.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-8 border border-dashed border-gray-200 rounded-xl">
                No pages available for this role
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => setSelectedPageIds(visiblePages.map(p => p.id))}>
                    Select all
                  </button>
                  <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => setSelectedPageIds([])}>
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {visiblePages.map(p => (
                    <label key={p.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedPageIds.includes(p.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input
                        type="checkbox"
                        checked={selectedPageIds.includes(p.id)}
                        onChange={() => togglePage(p.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 leading-tight">{p.label}</div>
                        <div className="text-xs text-gray-400 truncate mt-0.5">{p.path}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ASSET VISIBILITY */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <div>
                <div className="font-semibold text-gray-800">Asset Visibility</div>
                <div className="text-sm text-gray-500">Which asset types <span className="font-medium text-gray-700">{role || '—'}</span> can see</div>
              </div>
              <div className="ml-auto">
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1 font-medium">
                  {selectedAssetTypeIds.length} / {assetTypes.length} selected
                </span>
              </div>
            </div>

            {!centerId ? (
              <div className="text-sm text-gray-400 text-center py-8 border border-dashed border-gray-200 rounded-xl">
                Select a center to manage asset visibility
              </div>
            ) : assetTypes.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-8 border border-dashed border-gray-200 rounded-xl">
                No asset types available for this scope
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => setSelectedAssetTypeIds(assetTypes.map(t => t.id))}>
                    Select all
                  </button>
                  <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => setSelectedAssetTypeIds([])}>
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {assetTypes.map((t) => (
                    <label key={t.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedAssetTypeIds.includes(t.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input
                        type="checkbox"
                        checked={selectedAssetTypeIds.includes(t.id)}
                        onChange={() => toggleAssetType(t.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 leading-tight">{t.name}</div>
                        <div className="text-xs text-gray-400 truncate mt-0.5">{t.code} · {t.trackingMode}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── SAVE ACCESS RULES ── */}
        <div className="card">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="font-semibold text-gray-800">Save Access Rules</div>
              <div className="text-sm text-gray-500">Saves page access for the selected center / department / role scope.</div>
            </div>
            <div className="flex gap-3">
              <button onClick={saveConfig} disabled={configSaving || !isSuperAdmin} className="btn-secondary flex items-center gap-2">
                <Settings size={15} /> {configSaving ? 'Saving…' : 'Save Asset Config'}
              </button>
              <button onClick={save} className="btn-primary flex items-center gap-2" disabled={saving || !centerId}>
                <Save size={15} /> {saving ? 'Saving…' : 'Save Page Rules'}
              </button>
            </div>
          </div>
          {!isSuperAdmin && (
            <div className="text-xs text-amber-700 mt-2">Only SUPER_ADMIN can save product configuration.</div>
          )}
        </div>

        {/* ── PRODUCT CONFIG (collapsible-style, grouped) ── */}
        <div className="card space-y-5">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-gray-400" />
            <div className="font-semibold text-gray-800">Product Configuration</div>
            {!isSuperAdmin && <span className="ml-auto text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-0.5">Super Admin only</span>}
          </div>

          {/* Branding */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Branding</div>
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
          </div>

          {/* Feature flags + SMS toggles */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Features & SMS</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
              {[
                { label: 'SMS on Issue Assets', key: 'sms.issueEnabled', get: () => !!productConfig.sms?.issueEnabled, set: (v: boolean) => setProductConfig((p: any) => ({ ...p, sms: { ...p.sms, issueEnabled: v } })) },
                { label: 'SMS on Receive Assets', key: 'sms.receiveEnabled', get: () => !!productConfig.sms?.receiveEnabled, set: (v: boolean) => setProductConfig((p: any) => ({ ...p, sms: { ...p.sms, receiveEnabled: v } })) },
                { label: 'Unified Assets Module', key: 'ff.unified', get: () => !!productConfig.featureFlags?.unifiedAssetsEnabled, set: (v: boolean) => setProductConfig((p: any) => ({ ...p, featureFlags: { ...p.featureFlags, unifiedAssetsEnabled: v } })) },
                { label: 'Legacy Wireless Module', key: 'ff.legacy', get: () => !!productConfig.featureFlags?.legacyWirelessEnabled, set: (v: boolean) => setProductConfig((p: any) => ({ ...p, featureFlags: { ...p.featureFlags, legacyWirelessEnabled: v } })) },
                { label: 'QR Asset Flow', key: 'ff.qr', get: () => !!productConfig.featureFlags?.qrAssetFlowEnabled, set: (v: boolean) => setProductConfig((p: any) => ({ ...p, featureFlags: { ...p.featureFlags, qrAssetFlowEnabled: v } })) },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
                  <input type="checkbox" checked={item.get()} onChange={(e) => item.set(e.target.checked)} className="mt-0" />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Role config */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Role Configuration</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Center-head roles <span className="text-gray-400 font-normal text-xs">(cross-department access)</span></div>
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                  {roles.map((r) => {
                    const checked = (productConfig.centerHeadRoles || []).includes(r.name)
                    return (
                      <label key={r.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={checked}
                          onChange={(e) => setProductConfig((p: any) => ({
                            ...p,
                            centerHeadRoles: e.target.checked
                              ? [...(p.centerHeadRoles || []), r.name]
                              : (p.centerHeadRoles || []).filter((x: string) => x !== r.name),
                          }))} />
                        <span className="text-sm text-gray-700">{r.name}</span>
                      </label>
                    )
                  })}
                  {roles.length === 0 && <div className="px-3 py-2.5 text-sm text-gray-400">No roles loaded</div>}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">SMS defaults <span className="text-gray-400 font-normal text-xs">per role</span></div>
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                  {roles.map((r) => {
                    const entry = (productConfig.roleDefaults || []).find((x: any) => x.role === r.name)
                    const smsEnabled = entry ? !!entry.smsEnabled : true
                    return (
                      <label key={r.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50">
                        <input type="checkbox" checked={smsEnabled} onChange={() => toggleRoleSms(r.name)} />
                        <span className="text-sm text-gray-700 flex-1">{r.name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${smsEnabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {smsEnabled ? 'SMS ON' : 'SMS OFF'}
                        </span>
                      </label>
                    )
                  })}
                  {roles.length === 0 && <div className="px-3 py-2.5 text-sm text-gray-400">No roles loaded</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}