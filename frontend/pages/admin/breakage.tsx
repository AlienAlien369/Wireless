import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { breakagesApi, visitsApi, inventoryApi } from '../../services/api'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'

export default function BreakagePage() {
  const [breakages, setBreakages] = useState<any[]>([])
  const [visits, setVisits] = useState<any[]>([])
  const [wirelessSets, setWirelessSets] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterVisit, setFilterVisit] = useState('')
  const { register, handleSubmit, reset } = useForm<any>()

  const load = () => breakagesApi.getAll(filterVisit ? parseInt(filterVisit) : undefined).then(r => setBreakages(r.data))

  useEffect(() => {
    visitsApi.getAll().then(r => setVisits(r.data))
    inventoryApi.getSets().then(r => setWirelessSets(r.data))
    load()
  }, [])

  useEffect(() => { load() }, [filterVisit])

  const onSubmit = async (data: any) => {
    try {
      const ws = wirelessSets.find(s => s.id === parseInt(data.wirelessSetId))
      await breakagesApi.create({
        visitId: parseInt(data.visitId),
        wirelessSetId: data.wirelessSetId ? parseInt(data.wirelessSetId) : undefined,
        itemNumber: data.wirelessSetId ? (ws?.itemNumber || data.itemNumber) : data.itemNumber,
        breakageReason: data.breakageReason,
        reportedBy: data.reportedBy,
        remarks: data.remarks,
      })
      toast.success('Breakage reported')
      setShowForm(false); reset(); load()
    } catch { toast.error('Failed to report') }
  }

  return (
    <AdminLayout title="Breakage Tracking">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <select value={filterVisit} onChange={e => setFilterVisit(e.target.value)} className="input w-56">
            <option value="">All Visits</option>
            {visits.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <div className="ml-auto">
            <button onClick={() => { reset(); setShowForm(true) }} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Report Breakage
            </button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" /> Report Breakage
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <label className="label">Visit *</label>
                  <select {...register('visitId', { required: true })} className="input">
                    <option value="">Select Visit</option>
                    {visits.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Wireless Set (from inventory)</label>
                  <select {...register('wirelessSetId')} className="input">
                    <option value="">— Select if in inventory —</option>
                    {wirelessSets.map(s => <option key={s.id} value={s.id}>{s.itemNumber} ({s.brand})</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Item Number (manual if not in inventory)</label>
                  <input {...register('itemNumber')} className="input" placeholder="e.g. VT-05" />
                </div>
                <div>
                  <label className="label">Breakage Reason *</label>
                  <textarea {...register('breakageReason', { required: true })} className="input h-16 resize-none"
                    placeholder="Describe the damage..." />
                </div>
                <div>
                  <label className="label">Reported By *</label>
                  <input {...register('reportedBy', { required: true })} className="input" placeholder="Your name" />
                </div>
                <div>
                  <label className="label">Remarks</label>
                  <input {...register('remarks')} className="input" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-danger flex-1">Report</button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-red-50 border-b border-red-100">
              <tr>
                {['Sr.', 'Visit', 'Item#', 'Reason', 'Reported By', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {breakages.map((b, i) => (
                <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{b.visitName}</td>
                  <td className="px-4 py-3 font-medium text-red-700">{b.itemNumber}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">{b.breakageReason}</td>
                  <td className="px-4 py-3 text-gray-600">{b.reportedBy}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(b.reportedAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <button onClick={async () => { if (!confirm('Delete?')) return; await breakagesApi.delete(b.id); toast.success('Deleted'); load() }}
                      className="text-red-500 hover:text-red-700 p-1"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {breakages.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No breakages reported.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
