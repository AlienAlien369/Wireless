import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { inchargesApi } from '../../services/api'
import { Plus, Pencil, Trash2, User, Phone, Hash, Users, Search, X } from 'lucide-react'

interface Sewadaar { id: number; name: string; badgeNumber: string; mobileNumber: string; groupName?: string; isActive: boolean }

export default function InchargesPage() {
  const [incharges, setIncharges] = useState<Sewadaar[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Sewadaar | null>(null)
  const [search, setSearch] = useState('')
  const { register, handleSubmit, reset, setValue } = useForm<any>()

  const load = () => inchargesApi.getAll().then(r => setIncharges(r.data))
  useEffect(() => { load() }, [])

  const filtered = incharges.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.badgeNumber.toLowerCase().includes(search.toLowerCase())
  )

  const openEdit = (i: Sewadaar) => {
    setEditing(i)
    setValue('name', i.name); setValue('badgeNumber', i.badgeNumber)
    setValue('mobileNumber', i.mobileNumber); setValue('groupName', i.groupName || '')
    setShowForm(true)
  }

  const onSubmit = async (data: any) => {
    try {
      if (editing) await inchargesApi.update(editing.id, { ...data, isActive: true })
      else await inchargesApi.create(data)
      toast.success(editing ? 'Updated' : 'Sewadaar added')
      setShowForm(false); setEditing(null); reset(); load()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <AdminLayout title="Sewadaars">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card">
            <div className="text-3xl font-bold text-primary">{incharges.length}</div>
            <div className="text-sm text-gray-600">Total Sewadaars</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-green-600">{incharges.filter(i => i.isActive).length}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="card col-span-2 md:col-span-2">
            <div className="text-3xl font-bold text-purple-600">{incharges.filter(i => i.groupName).length}</div>
            <div className="text-sm text-gray-600">Grouped Sewadaars</div>
          </div>
        </div>

        {/* Search & Add */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input pl-10 pr-10 w-full" placeholder="Search by name or badge..." />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <X size={18} />
              </button>
            )}
          </div>
          <button onClick={() => { setEditing(null); reset(); setShowForm(true) }}
            className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Sewadaar
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit' : 'New'} Sewadaar</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <label className="label">Full Name *</label>
                  <input {...register('name', { required: true })} className="input" placeholder="Sewadar name" />
                </div>
                <div>
                  <label className="label">Badge Number *</label>
                  <input {...register('badgeNumber', { required: true })} className="input" placeholder="e.g. B-1234" />
                </div>
                <div>
                  <label className="label">Mobile Number *</label>
                  <input {...register('mobileNumber', { required: true })} className="input" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="label">Group Name</label>
                  <input {...register('groupName')} className="input" placeholder="e.g. Pandal Gate Team" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary flex-1">Save</button>
                  <button type="button" onClick={() => { setShowForm(false); setEditing(null) }}
                    className="btn-secondary flex-1">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mobile Card View */}
        <div className="space-y-3 md:hidden">
          {filtered.length === 0 ? (
            <div className="card text-center py-12">
              <User size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No sewadaars found</p>
            </div>
          ) : (
            filtered.map((i) => (
              <div key={i.id} className={`card border-l-4 p-4 ${i.isActive ? 'border-green-500' : 'border-red-500'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-gradient-to-br from-primary to-primary-dark text-sm">
                      {getInitials(i.name)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{i.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{i.badgeNumber}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(i)} className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg">
                      <Pencil size={16} />
                    </button>
                    <button onClick={async () => { if (!confirm('Delete?')) return; await inchargesApi.delete(i.id); toast.success('Deleted'); load() }}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={14} className="text-gray-400" />
                    <a href={`tel:${i.mobileNumber}`} className="text-blue-600 hover:underline">{i.mobileNumber}</a>
                  </div>
                  {i.groupName && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users size={14} className="text-gray-400" />
                      {i.groupName}
                    </div>
                  )}
                  <div className="pt-2">
                    <span className={i.isActive ? 'badge-available' : 'badge-broken'}>
                      {i.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block card p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  {['Sr.', 'Name', 'Badge#', 'Mobile', 'Group', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((i, idx) => (
                  <tr key={i.id} className="border-b border-gray-100 hover:bg-purple-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-medium">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs bg-gradient-to-br from-primary to-primary-dark">
                          {getInitials(i.name)}
                        </div>
                        <span className="font-bold text-gray-800">{i.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="flex items-center gap-1 text-gray-600 font-medium"><Hash size={12} />{i.badgeNumber}</span></td>
                    <td className="px-4 py-3">
                      <a href={`tel:${i.mobileNumber}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Phone size={12} />{i.mobileNumber}
                      </a>
                    </td>
                    <td className="px-4 py-3"><span className="flex items-center gap-1 text-gray-600 text-xs"><Users size={12} />{i.groupName || '—'}</span></td>
                    <td className="px-4 py-3">
                      <span className={i.isActive ? 'badge-available' : 'badge-broken'}>
                        {i.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(i)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={async () => { if (!confirm('Delete?')) return; await inchargesApi.delete(i.id); toast.success('Deleted'); load() }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">No sewadaars found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
