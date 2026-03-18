import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { inventoryApi } from '../../services/api'
import { Plus, Trash2, QrCode, Radio, Battery, Headphones } from 'lucide-react'

type Tab = 'sets' | 'chargers' | 'kits'

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('sets')
  const [sets, setSets] = useState<any[]>([])
  const [chargers, setChargers] = useState<any[]>([])
  const [kits, setKits] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterBrand, setFilterBrand] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const { register, handleSubmit, reset, watch } = useForm<any>()
  const brand = watch('brand')

  const loadAll = () => {
    inventoryApi.getSets().then(r => setSets(r.data))
    inventoryApi.getChargers().then(r => setChargers(r.data))
    inventoryApi.getKits().then(r => setKits(r.data))
  }
  useEffect(() => { loadAll() }, [])

  const filteredSets = sets.filter(s =>
    (!filterBrand || s.brand === filterBrand) && (!filterStatus || s.status === filterStatus)
  )

  const createSet = async (data: any) => {
    try {
      await inventoryApi.createSet(data)
      toast.success(`${data.brand} set ${data.itemNumber} added`)
      setShowForm(false); reset(); loadAll()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
  }

  const createCharger = async (data: any) => {
    try {
      await inventoryApi.createCharger(data)
      toast.success('Charger added'); setShowForm(false); reset(); loadAll()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
  }

  const createKit = async (data: any) => {
    try {
      await inventoryApi.createKit(data)
      toast.success('Kit added'); setShowForm(false); reset(); loadAll()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
  }

  const deleteSet = async (id: number) => {
    if (!confirm('Delete this set?')) return
    await inventoryApi.deleteSet(id); toast.success('Deleted'); loadAll()
  }

  const statusBadge = (s: string) => {
    if (s === 'Available') return <span className="badge-available">Available</span>
    if (s === 'Issued') return <span className="badge-issued">Issued</span>
    return <span className="badge-broken">Broken</span>
  }

  return (
    <AdminLayout title="Inventory">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {([['sets', 'Wireless Sets', Radio], ['chargers', 'Chargers', Battery], ['kits', 'Kits/Earphones', Headphones]] as any[]).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key as Tab)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors
                ${tab === key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {tab === 'sets' && (
            <>
              <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="input w-40">
                <option value="">All Brands</option>
                <option>Kenwood</option><option>Vertel</option><option>Aspera</option>
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input w-40">
                <option value="">All Status</option>
                <option>Available</option><option>Issued</option><option>Broken</option>
              </select>
            </>
          )}
          <div className="ml-auto">
            <button onClick={() => { setShowForm(true); reset() }} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add {tab === 'sets' ? 'Wireless Set' : tab === 'chargers' ? 'Charger' : 'Kit'}
            </button>
          </div>
        </div>

        {/* Create Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-4">
                Add {tab === 'sets' ? 'Wireless Set' : tab === 'chargers' ? 'Charger' : 'Earphone Kit'}
              </h2>
              <form onSubmit={handleSubmit(tab === 'sets' ? createSet : tab === 'chargers' ? createCharger : createKit)}
                className="space-y-3">
                {(tab === 'sets' || tab === 'chargers') && (
                  <div>
                    <label className="label">Brand *</label>
                    <select {...register('brand', { required: true })} className="input">
                      <option value="">Select Brand</option>
                      <option>Kenwood</option><option>Vertel</option><option>Aspera</option>
                    </select>
                  </div>
                )}
                {(tab !== 'chargers' || brand !== 'Aspera') && (
                  <div>
                    <label className="label">
                      {tab === 'chargers' && brand === 'Aspera' ? 'No number for Aspera' : 'Item Number *'}
                    </label>
                    <input {...register('itemNumber', { required: tab !== 'chargers' || brand !== 'Aspera' })}
                      className="input"
                      placeholder={tab === 'sets' ? 'e.g. KW-21' : tab === 'kits' ? 'e.g. KIT-01' : 'e.g. CHR-01'} />
                    {tab === 'sets' && brand === 'Kenwood' && (
                      <p className="text-xs text-blue-600 mt-1">QR code will be auto-generated for Kenwood sets</p>
                    )}
                  </div>
                )}
                <div>
                  <label className="label">Remarks</label>
                  <input {...register('remarks')} className="input" placeholder="Optional..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary flex-1">Add</button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Wireless Sets Table */}
        {tab === 'sets' && (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Sr.', 'Item#', 'Brand', 'Status', 'QR Code', 'Remarks', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSets.map((s, i) => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{s.itemNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium
                        ${s.brand === 'Kenwood' ? 'bg-blue-100 text-blue-700' :
                          s.brand === 'Vertel' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'}`}>
                        {s.brand}
                      </span>
                    </td>
                    <td className="px-4 py-3">{statusBadge(s.status)}</td>
                    <td className="px-4 py-3">
                      {s.qrCodeUrl ? (
                        <button
                          onClick={() => {
                            const newTab = window.open();
                            newTab.document.write(
                              `<html><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#000">
             <img src="${s.qrCodeUrl}" style="max-width:100%;height:auto;" />
           </body></html>`
                            );
                          }}
                          className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                        >
                          <QrCode size={15} /> View
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.remarks || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteSet(s.id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredSets.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">No wireless sets found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Chargers Table */}
        {tab === 'chargers' && (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Sr.', 'Item#', 'Brand', 'Status', 'Remarks', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chargers.map((c, i) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{c.itemNumber || <span className="text-gray-400 text-xs">No # (Aspera)</span>}</td>
                    <td className="px-4 py-3">{c.brand}</td>
                    <td className="px-4 py-3">{statusBadge(c.status)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.remarks || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={async () => { await inventoryApi.deleteCharger(c.id); toast.success('Deleted'); loadAll() }}
                        className="text-red-500 hover:text-red-700 p-1"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Kits Table */}
        {tab === 'kits' && (
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
              <p className="text-xs text-blue-700">Kits/Earphones are only for Kenwood wireless sets.</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Sr.', 'Kit Number', 'Status', 'Remarks', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kits.map((k, i) => (
                  <tr key={k.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{k.itemNumber}</td>
                    <td className="px-4 py-3">{statusBadge(k.status)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{k.remarks || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={async () => { await inventoryApi.deleteKit(k.id); toast.success('Deleted'); loadAll() }}
                        className="text-red-500 hover:text-red-700 p-1"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
