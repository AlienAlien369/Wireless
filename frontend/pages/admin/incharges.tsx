import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { inchargesApi } from '../../services/api'
import { Plus, Pencil, Trash2, User, Phone, Hash, Users } from 'lucide-react'

interface Incharge { id: number; name: string; badgeNumber: string; mobileNumber: string; groupName?: string; isActive: boolean }

export default function InchargesPage() {
  const [incharges, setIncharges] = useState<Incharge[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Incharge | null>(null)
  const [search, setSearch] = useState('')
  const { register, handleSubmit, reset, setValue } = useForm<any>()

  const load = () => inchargesApi.getAll().then(r => setIncharges(r.data))
  useEffect(() => { load() }, [])

  const filtered = incharges.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.badgeNumber.toLowerCase().includes(search.toLowerCase())
  )

  const openEdit = (i: Incharge) => {
    setEditing(i)
    setValue('name', i.name); setValue('badgeNumber', i.badgeNumber)
    setValue('mobileNumber', i.mobileNumber); setValue('groupName', i.groupName || '')
    setShowForm(true)
  }

  const onSubmit = async (data: any) => {
    try {
      if (editing) await inchargesApi.update(editing.id, { ...data, isActive: true })
      else await inchargesApi.create(data)
      toast.success(editing ? 'Updated' : 'Incharge added')
      setShowForm(false); setEditing(null); reset(); load()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
  }

  return (
    <AdminLayout title="Incharges">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input w-64" placeholder="Search by name or badge..." />
          <div className="ml-auto">
            <button onClick={() => { setEditing(null); reset(); setShowForm(true) }}
              className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add Incharge
            </button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit' : 'New'} Incharge</h2>
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

        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Sr.', 'Name', 'Badge#', 'Mobile', 'Group', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((i, idx) => (
                <tr key={i.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User size={14} className="text-primary" />
                      </div>
                      <span className="font-medium text-gray-800">{i.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1 text-gray-600"><Hash size={12} />{i.badgeNumber}</span></td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1 text-gray-600"><Phone size={12} />{i.mobileNumber}</span></td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1 text-gray-500 text-xs"><Users size={12} />{i.groupName || '—'}</span></td>
                  <td className="px-4 py-3">
                    <span className={i.isActive ? 'badge-available' : 'badge-broken'}>
                      {i.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(i)} className="text-blue-500 hover:text-blue-700 p-1"><Pencil size={15} /></button>
                      <button onClick={async () => { if (!confirm('Delete?')) return; await inchargesApi.delete(i.id); toast.success('Deleted'); load() }}
                        className="text-red-500 hover:text-red-700 p-1"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No incharges found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
