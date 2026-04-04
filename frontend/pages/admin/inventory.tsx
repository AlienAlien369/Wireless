import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { inventoryApi } from '../../services/api'
import { Plus, Trash2, QrCode, Radio, Battery, Headphones, Search, X } from 'lucide-react'

type Tab = 'sets' | 'chargers' | 'kits'

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('sets')
  const [sets, setSets] = useState<any[]>([])
  const [chargers, setChargers] = useState<any[]>([])
  const [kits, setKits] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterBrand, setFilterBrand] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchText, setSearchText] = useState('')
  const { register, handleSubmit, reset, watch } = useForm<any>()
  const brand = watch('brand')

  const loadAll = () => {
    inventoryApi.getSets().then(r => setSets(r.data))
    inventoryApi.getChargers().then(r => setChargers(r.data))
    inventoryApi.getKits().then(r => setKits(r.data))
  }
  useEffect(() => { loadAll() }, [])

  const filteredSets = sets.filter(s =>
    (!filterBrand || s.brand === filterBrand) && 
    (!filterStatus || s.status === filterStatus) &&
    (s.itemNumber.toLowerCase().includes(searchText.toLowerCase()))
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

  const getBrandColor = (brand: string) => {
    switch (brand) {
      case 'Kenwood': return 'from-blue-500 to-blue-600'
      case 'Vertel': return 'from-green-500 to-green-600'
      case 'Aspera': return 'from-purple-500 to-purple-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-50 border-green-200'
      case 'Issued': return 'bg-yellow-50 border-yellow-200'
      case 'Broken': return 'bg-red-50 border-red-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const stats = {
    total: sets.length,
    available: sets.filter(s => s.status === 'Available').length,
    issued: sets.filter(s => s.status === 'Issued').length,
    broken: sets.filter(s => s.status === 'Broken').length,
  }

  return (
    <AdminLayout title="Inventory">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-700">Total Sets</div>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <div className="text-3xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-green-700">Available</div>
          </div>
          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
            <div className="text-3xl font-bold text-yellow-600">{stats.issued}</div>
            <div className="text-sm text-yellow-700">Issued</div>
          </div>
          <div className="card bg-gradient-to-br from-red-50 to-red-100 border border-red-200">
            <div className="text-3xl font-bold text-red-600">{stats.broken}</div>
            <div className="text-sm text-red-700">Broken</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
          {([['sets', 'Wireless Sets', Radio], ['chargers', 'Chargers', Battery], ['kits', 'Kits/Earphones', Headphones]] as any[]).map(([key, label, Icon]) => (
            <button key={key} onClick={() => { setTab(key as Tab); setSearchText('') }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${tab === key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="card bg-white">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={tab === 'sets' ? 'Search by item number...' : 'Search...'}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="input pl-10 pr-10"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Filters */}
            {tab === 'sets' && (
              <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4">
                <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="input text-sm">
                  <option value="">All Brands</option>
                  <option value="Kenwood">Kenwood</option><option value="Vertel">Vertel</option><option value="Aspera">Aspera</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input text-sm">
                  <option value="">All Status</option>
                  <option value="Available">Available</option><option value="Issued">Issued</option><option value="Broken">Broken</option>
                </select>
                <button
                  onClick={() => { setFilterBrand(''); setFilterStatus('') }}
                  className="btn-secondary text-sm md:col-span-2 col-span-2"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Button */}
        <div className="flex justify-end">
          <button onClick={() => { setShowForm(true); reset() }} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add {tab === 'sets' ? 'Wireless Set' : tab === 'chargers' ? 'Charger' : 'Kit'}
          </button>
        </div>

        {/* Create Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
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

        {/* Wireless Sets - Card View on Mobile, Table on Desktop */}
        {tab === 'sets' && (
          <>
            {/* Mobile Card View */}
            <div className="space-y-3 md:hidden">
              {filteredSets.length === 0 ? (
                <div className="card text-center py-12">
                  <Radio size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No wireless sets found</p>
                </div>
              ) : (
                filteredSets.map((s) => (
                  <div key={s.id} className={`card border-l-4 p-4 ${getStatusColor(s.status)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-lg font-bold text-gray-800">{s.itemNumber}</div>
                        <div className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium text-white bg-gradient-to-r ${getBrandColor(s.brand)}`}>
                          {s.brand}
                        </div>
                      </div>
                      <button onClick={() => deleteSet(s.id)} className="text-red-500 hover:text-red-700 p-2">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status:</span>
                        <div>{statusBadge(s.status)}</div>
                      </div>
                      {s.remarks && (
                        <div>
                          <span className="text-sm text-gray-600">Note:</span>
                          <p className="text-sm text-gray-700 mt-1">{s.remarks}</p>
                        </div>
                      )}
                      {s.qrCodeUrl && (
                        <button
                          onClick={() => {
                            const newTab = window.open();
                            newTab.document.write(
                              `<html><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#000"><img src="${s.qrCodeUrl}" style="max-width:100%;height:auto;" /></body></html>`
                            );
                          }}
                          className="w-full mt-3 btn-secondary flex items-center justify-center gap-2"
                        >
                          <QrCode size={16} /> View QR Code
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block card p-0">
              <div className="table-responsive">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      {['Sr.', 'Item#', 'Brand', 'Status', 'QR Code', 'Remarks', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-gray-700">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSets.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-10 text-gray-400">No wireless sets found.</td></tr>
                    ) : (
                      filteredSets.map((s, i) => (
                        <tr key={s.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 text-gray-500 font-medium">{i + 1}</td>
                          <td className="px-4 py-3 font-bold text-gray-800">{s.itemNumber}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-3 py-1 rounded-full font-semibold text-white bg-gradient-to-r ${getBrandColor(s.brand)}`}>
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
                                    `<html><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#000"><img src="${s.qrCodeUrl}" style="max-width:100%;height:auto;" /></body></html>`
                                  );
                                }}
                                className="text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1"
                              >
                                <QrCode size={15} /> View
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{s.remarks || '—'}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => deleteSet(s.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Chargers - Card View on Mobile, Table on Desktop */}
        {tab === 'chargers' && (
          <>
            {/* Mobile Card View */}
            <div className="space-y-3 md:hidden">
              {chargers.length === 0 ? (
                <div className="card text-center py-12">
                  <Battery size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No chargers found</p>
                </div>
              ) : (
                chargers.map((c) => (
                  <div key={c.id} className={`card border-l-4 p-4 ${getStatusColor(c.status)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-lg font-bold text-gray-800">{c.itemNumber || '(No #) Aspera'}</div>
                        <div className="inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600">
                          {c.brand}
                        </div>
                      </div>
                      <button onClick={async () => { await inventoryApi.deleteCharger(c.id); toast.success('Deleted'); loadAll() }} className="text-red-500 hover:text-red-700 p-2">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status:</span>
                        <div>{statusBadge(c.status)}</div>
                      </div>
                      {c.remarks && (
                        <div>
                          <span className="text-sm text-gray-600">Note:</span>
                          <p className="text-sm text-gray-700 mt-1">{c.remarks}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block card p-0">
              <div className="table-responsive">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      {['Sr.', 'Item#', 'Brand', 'Status', 'Remarks', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-gray-700">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chargers.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-gray-400">No chargers found.</td></tr>
                    ) : (
                      chargers.map((c, i) => (
                        <tr key={c.id} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                          <td className="px-4 py-3 text-gray-500 font-medium">{i + 1}</td>
                          <td className="px-4 py-3 font-bold text-gray-800">{c.itemNumber || <span className="text-gray-400 text-xs">(No #)</span>}</td>
                          <td className="px-4 py-3">{c.brand}</td>
                          <td className="px-4 py-3">{statusBadge(c.status)}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{c.remarks || '—'}</td>
                          <td className="px-4 py-3">
                            <button onClick={async () => { await inventoryApi.deleteCharger(c.id); toast.success('Deleted'); loadAll() }} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Kits - Card View on Mobile, Table on Desktop */}
        {tab === 'kits' && (
          <>
            {/* Mobile Card View */}
            <div className="space-y-3 md:hidden">
              {kits.length === 0 ? (
                <div className="card text-center py-12">
                  <Headphones size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No kits found</p>
                </div>
              ) : (
                kits.map((k) => (
                  <div key={k.id} className={`card border-l-4 p-4 ${getStatusColor(k.status)}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="text-lg font-bold text-gray-800">{k.itemNumber}</div>
                        <div className="inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium text-white bg-gradient-to-r from-indigo-500 to-indigo-600">
                          Kenwood Kit
                        </div>
                      </div>
                      <button onClick={async () => { await inventoryApi.deleteKit(k.id); toast.success('Deleted'); loadAll() }} className="text-red-500 hover:text-red-700 p-2">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status:</span>
                        <div>{statusBadge(k.status)}</div>
                      </div>
                      {k.remarks && (
                        <div>
                          <span className="text-sm text-gray-600">Note:</span>
                          <p className="text-sm text-gray-700 mt-1">{k.remarks}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block card p-0">
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 rounded-t-xl">
                <p className="text-sm text-blue-700 font-medium">Kits/Earphones are only for Kenwood wireless sets.</p>
              </div>
              <div className="table-responsive">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      {['Sr.', 'Kit Number', 'Status', 'Remarks', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-gray-700">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kits.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-10 text-gray-400">No kits found.</td></tr>
                    ) : (
                      kits.map((k, i) => (
                        <tr key={k.id} className="border-b border-gray-100 hover:bg-indigo-50 transition-colors">
                          <td className="px-4 py-3 text-gray-500 font-medium">{i + 1}</td>
                          <td className="px-4 py-3 font-bold text-gray-800">{k.itemNumber}</td>
                          <td className="px-4 py-3">{statusBadge(k.status)}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{k.remarks || '—'}</td>
                          <td className="px-4 py-3">
                            <button onClick={async () => { await inventoryApi.deleteKit(k.id); toast.success('Deleted'); loadAll() }} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
