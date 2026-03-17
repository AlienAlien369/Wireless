import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { visitsApi } from '../../services/api'
import { Plus, Pencil, Trash2, MapPin, Calendar } from 'lucide-react'

interface Visit {
  id: number; name: string; location: string; visitDate: string; remarks?: string; isActive: boolean
}
interface FormData { name: string; location: string; visitDate: string; remarks?: string; isActive?: boolean }

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Visit | null>(null)
  const { register, handleSubmit, reset, setValue } = useForm<FormData>()

  const load = () => visitsApi.getAll().then(r => setVisits(r.data))
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); reset(); setShowForm(true) }
  const openEdit = (v: Visit) => {
    setEditing(v)
    setValue('name', v.name); setValue('location', v.location)
    setValue('visitDate', v.visitDate.split('T')[0]); setValue('remarks', v.remarks || '')
    setShowForm(true)
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) await visitsApi.update(editing.id, { ...data, isActive: true })
      else await visitsApi.create(data)
      toast.success(editing ? 'Visit updated' : 'Visit created')
      setShowForm(false); load()
    } catch { toast.error('Failed to save visit') }
  }

  const onDelete = async (id: number) => {
    if (!confirm('Delete this visit?')) return
    try { await visitsApi.delete(id); toast.success('Deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  return (
    <AdminLayout title="Visits">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">Manage spiritual visit events. All issuances must belong to a visit.</p>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Visit
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit' : 'New'} Visit</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <label className="label">Visit Name *</label>
                  <input {...register('name', { required: true })} className="input" placeholder="e.g. Baba Ji Bhatti Visit 2026" />
                </div>
                <div>
                  <label className="label">Location *</label>
                  <input {...register('location', { required: true })} className="input" placeholder="e.g. Bhatti Center" />
                </div>
                <div>
                  <label className="label">Date *</label>
                  <input {...register('visitDate', { required: true })} type="date" className="input" />
                </div>
                <div>
                  <label className="label">Remarks</label>
                  <textarea {...register('remarks')} className="input h-20 resize-none" placeholder="Optional notes..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary flex-1">Save</button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Sr.', 'Visit Name', 'Location', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visits.map((v, i) => (
                <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{v.name}</div>
                    {v.remarks && <div className="text-xs text-gray-400">{v.remarks}</div>}
                  </td>
                  <td className="px-4 py-3 flex items-center gap-1 text-gray-600">
                    <MapPin size={14} className="text-gray-400" />{v.location}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(v.visitDate).toLocaleDateString('en-IN')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={v.isActive ? 'badge-available' : 'badge-issued'}>
                      {v.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(v)} className="text-blue-500 hover:text-blue-700 p-1">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => onDelete(v.id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visits.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No visits yet. Create your first visit!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
