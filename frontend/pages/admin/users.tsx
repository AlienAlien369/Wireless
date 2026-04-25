import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { rolesApi, tenantsApi, usersApi } from '../../services/api'
import { Plus, KeyRound, Save, X, Pencil, Trash2 } from 'lucide-react'

type Center = { id: number; name: string; isActive: boolean }
type Department = { id: number; centerId: number; name: string; isActive: boolean }
type Role = { id: number; name: string; audience: string; isActive: boolean }
type User = {
  id: string
  username: string
  fullName: string
  role: string
  centerId: number | null
  centerName: string | null
  departmentId: number | null
  departmentName: string | null
  badgeNumber: string | null
  email: string | null
  phoneNumber: string | null
  isActive: boolean
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [roles, setRoles] = useState<Role[]>([])

  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<any>({
    username: '',
    password: '',
    fullName: '',
    role: 'Admin',
    centerId: null as number | null,
    departmentId: null as number | null,
    badgeNumber: '',
    email: '',
    phoneNumber: '',
    isActive: true,
  })

  const [newPassword, setNewPassword] = useState('')

  const load = async () => {
    const [u, c, r] = await Promise.all([usersApi.getAll(), tenantsApi.getCenters(), rolesApi.getAll()])
    setUsers(u.data || [])
    setCenters((c.data || []).filter((x: any) => x.isActive))
    setRoles((r.data || []).filter((x: any) => x.isActive))
  }

  useEffect(() => {
    load().catch(() => toast.error('Failed to load users'))
  }, [])

  useEffect(() => {
    const cId = form.centerId
    if (!cId) { setDepartments([]); setForm((p: any) => ({ ...p, departmentId: null })); return }
    tenantsApi.getDepartments(cId).then((res) => {
      setDepartments((res.data || []).filter((x: any) => x.isActive))
      setForm((p: any) => ({ ...p, departmentId: null }))
    }).catch(() => setDepartments([]))
  }, [form.centerId])

  const roleOptions = useMemo(() => roles.map(r => r.name), [roles])

  const openCreate = () => {
    const stored = JSON.parse(localStorage.getItem('user') || 'null')
    setForm({
      username: '',
      password: '',
      fullName: '',
      role: roleOptions.includes('Admin') ? 'Admin' : (roleOptions[0] || ''),
      centerId: stored?.centerId ?? null,
      departmentId: stored?.departmentId ?? null,
      badgeNumber: '',
      email: '',
      phoneNumber: '',
      isActive: true,
    })
    setShowCreate(true)
  }

  const createUser = async () => {
    if (!form.username || !form.password || !form.fullName || !form.role) {
      toast.error('Username, password, full name and role are required')
      return
    }
    setSaving(true)
    try {
      await usersApi.create({
        username: form.username,
        password: form.password,
        fullName: form.fullName,
        role: form.role,
        centerId: form.centerId,
        departmentId: form.departmentId,
        badgeNumber: form.badgeNumber || null,
        email: form.email || null,
        phoneNumber: form.phoneNumber || null,
        isActive: form.isActive,
      })
      toast.success('User created')
      setShowCreate(false)
      await load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  const setPassword = async () => {
    if (!showPassword) return
    if (!newPassword) { toast.error('Enter a new password'); return }
    setSaving(true)
    try {
      await usersApi.setPassword(showPassword.id, newPassword)
      toast.success('Password updated')
      setShowPassword(null)
      setNewPassword('')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (u: User) => {
    setForm({
      username: u.username,
      password: '',
      fullName: u.fullName,
      role: u.role,
      centerId: u.centerId,
      departmentId: u.departmentId,
      badgeNumber: u.badgeNumber || '',
      email: u.email || '',
      phoneNumber: u.phoneNumber || '',
      isActive: u.isActive,
    })
    setShowEdit(u)
  }

  const updateUser = async () => {
    if (!showEdit) return
    if (!form.fullName || !form.role) {
      toast.error('Full name and role are required')
      return
    }
    setSaving(true)
    try {
      await usersApi.update(showEdit.id, {
        fullName: form.fullName,
        role: form.role,
        centerId: form.centerId,
        departmentId: form.departmentId,
        badgeNumber: form.badgeNumber || null,
        email: form.email || null,
        phoneNumber: form.phoneNumber || null,
        isActive: form.isActive,
      })
      toast.success('User updated')
      setShowEdit(null)
      await load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const deleteUser = async (u: User) => {
    if (!confirm(`Delete user "${u.username}"?`)) return
    try {
      await usersApi.delete(u.id)
      toast.success('User deleted')
      await load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete user')
    }
  }

  return (
    <AdminLayout title="Users">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-gray-500 text-sm">Manage login users, center/department, roles, phone/email, and passwords.</p>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New User
          </button>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-3">Username</th>
                <th className="py-2 pr-3">Full Name</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Center</th>
                <th className="py-2 pr-3">Department</th>
                <th className="py-2 pr-3">Phone</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Active</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-3 font-medium">{u.username}</td>
                  <td className="py-2 pr-3">{u.fullName}</td>
                  <td className="py-2 pr-3">{u.role}</td>
                  <td className="py-2 pr-3">{u.centerName || '-'}</td>
                  <td className="py-2 pr-3">{u.departmentName || '-'}</td>
                  <td className="py-2 pr-3">{u.phoneNumber || '-'}</td>
                  <td className="py-2 pr-3">{u.email || '-'}</td>
                  <td className="py-2 pr-3">{u.isActive ? 'Yes' : 'No'}</td>
                  <td className="py-2 pr-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="btn-secondary flex items-center gap-2">
                        <Pencil size={16} /> Edit
                      </button>
                      <button onClick={() => setShowPassword(u)} className="btn-secondary flex items-center gap-2">
                        <KeyRound size={16} /> Set Password
                      </button>
                      <button onClick={() => deleteUser(u)} className="btn-secondary flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50">
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td className="py-6 text-center text-gray-500" colSpan={9}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Create User</h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-700"><X size={18} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Username *</label>
                  <input className="input" value={form.username} onChange={(e) => setForm((p: any) => ({ ...p, username: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Password *</label>
                  <input type="password" className="input" value={form.password} onChange={(e) => setForm((p: any) => ({ ...p, password: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input" value={form.fullName} onChange={(e) => setForm((p: any) => ({ ...p, fullName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Role *</label>
                  <select className="input" value={form.role} onChange={(e) => setForm((p: any) => ({ ...p, role: e.target.value }))}>
                    {roles.filter(r => r.isActive).map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Center</label>
                  <select className="input" value={form.centerId ?? ''} onChange={(e) => setForm((p: any) => ({ ...p, centerId: e.target.value ? Number(e.target.value) : null }))}>
                    <option value="">Select center...</option>
                    {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Department</label>
                  <select className="input" value={form.departmentId ?? ''} onChange={(e) => setForm((p: any) => ({ ...p, departmentId: e.target.value ? Number(e.target.value) : null }))}>
                    <option value="">Select department...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phoneNumber} onChange={(e) => setForm((p: any) => ({ ...p, phoneNumber: e.target.value }))} placeholder="+91..." />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" value={form.email} onChange={(e) => setForm((p: any) => ({ ...p, email: e.target.value }))} placeholder="user@domain.com" />
                </div>
                <div>
                  <label className="label">Badge Number</label>
                  <input className="input" value={form.badgeNumber} onChange={(e) => setForm((p: any) => ({ ...p, badgeNumber: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} />
                  <span className="text-sm text-gray-700">Active</span>
                </div>
              </div>

              <div className="flex gap-3 pt-5">
                <button onClick={createUser} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Save size={16} /> {saving ? 'Saving...' : 'Create'}
                </button>
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Edit User</h2>
                <button onClick={() => setShowEdit(null)} className="text-gray-500 hover:text-gray-700"><X size={18} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Username</label>
                  <input className="input bg-gray-100" value={form.username} disabled />
                </div>
                <div>
                  <label className="label">Full Name *</label>
                  <input className="input" value={form.fullName} onChange={(e) => setForm((p: any) => ({ ...p, fullName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Role *</label>
                  <select className="input" value={form.role} onChange={(e) => setForm((p: any) => ({ ...p, role: e.target.value }))}>
                    {roles.filter(r => r.isActive).map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Center</label>
                  <select className="input" value={form.centerId ?? ''} onChange={(e) => setForm((p: any) => ({ ...p, centerId: e.target.value ? Number(e.target.value) : null }))}>
                    <option value="">Select center...</option>
                    {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Department</label>
                  <select className="input" value={form.departmentId ?? ''} onChange={(e) => setForm((p: any) => ({ ...p, departmentId: e.target.value ? Number(e.target.value) : null }))}>
                    <option value="">Select department...</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phoneNumber} onChange={(e) => setForm((p: any) => ({ ...p, phoneNumber: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" value={form.email} onChange={(e) => setForm((p: any) => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Badge Number</label>
                  <input className="input" value={form.badgeNumber} onChange={(e) => setForm((p: any) => ({ ...p, badgeNumber: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p: any) => ({ ...p, isActive: e.target.checked }))} />
                  <span className="text-sm text-gray-700">Active</span>
                </div>
              </div>

              <div className="flex gap-3 pt-5">
                <button onClick={updateUser} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Save size={16} /> {saving ? 'Saving...' : 'Update'}
                </button>
                <button onClick={() => setShowEdit(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Set Password</h2>
                <button onClick={() => setShowPassword(null)} className="text-gray-500 hover:text-gray-700"><X size={18} /></button>
              </div>
              <div className="text-sm text-gray-600 mb-3">User: <span className="font-medium text-gray-800">{showPassword.username}</span></div>
              <label className="label">New Password</label>
              <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <div className="flex gap-3 pt-5">
                <button onClick={setPassword} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <KeyRound size={16} /> {saving ? 'Updating...' : 'Update'}
                </button>
                <button onClick={() => setShowPassword(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

