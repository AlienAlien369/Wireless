import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { assetsApi, tenantsApi } from '../../services/api'
import { Plus, Save, Wrench } from 'lucide-react'

type Center = { id: number; name: string; isActive: boolean }
type AssetType = { id: number; centerId: number; code: string; name: string; trackingMode: string; isActive: boolean }
type Asset = { id: number; assetTypeId: number; assetTypeCode: string; assetTypeName: string; itemNumber: string | null; brand: string | null; status: string; remarks: string | null }

export default function AssetsPage() {
  const [centers, setCenters] = useState<Center[]>([])
  const [centerId, setCenterId] = useState<number | null>(null)

  const [types, setTypes] = useState<AssetType[]>([])
  const [assets, setAssets] = useState<Asset[]>([])

  const [newType, setNewType] = useState({ code: '', name: '', trackingMode: 'Individual' })
  const [newAsset, setNewAsset] = useState({ assetTypeId: 0, itemNumber: '', brand: '', remarks: '' })

  const load = async (cId: number) => {
    const [t, a] = await Promise.all([
      assetsApi.getTypes(cId),
      assetsApi.getAssets(cId, undefined, undefined),
    ])
    setTypes(t.data || [])
    setAssets(a.data || [])
  }

  useEffect(() => {
    tenantsApi.getCenters().then((res) => {
      const list = (res.data || []).filter((x: any) => x.isActive)
      setCenters(list)
      const stored = JSON.parse(localStorage.getItem('user') || 'null')
      const preferred = stored?.centerId
      const next = preferred || (list[0]?.id ?? null)
      setCenterId(next)
    }).catch(() => toast.error('Failed to load centers'))
  }, [])

  useEffect(() => {
    if (!centerId) return
    load(centerId).catch(() => toast.error('Failed to load assets'))
  }, [centerId])

  useEffect(() => {
    if (types.length && !newAsset.assetTypeId) setNewAsset((p) => ({ ...p, assetTypeId: types[0].id }))
  }, [types])

  const visibleAssets = useMemo(() => assets.sort((a, b) => (a.assetTypeName + (a.itemNumber || '')).localeCompare(b.assetTypeName + (b.itemNumber || ''))), [assets])

  const createType = async () => {
    if (!centerId) { toast.error('Select a center'); return }
    const code = newType.code.trim()
    const name = newType.name.trim()
    if (!code || !name) { toast.error('Code and name are required'); return }
    try {
      await assetsApi.createType({ centerId, code, name, trackingMode: newType.trackingMode })
      toast.success('Asset type created')
      setNewType({ code: '', name: '', trackingMode: 'Individual' })
      await load(centerId)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create asset type')
    }
  }

  const createAsset = async () => {
    if (!centerId) { toast.error('Select a center'); return }
    if (!newAsset.assetTypeId) { toast.error('Select asset type'); return }
    try {
      await assetsApi.createAsset({
        centerId,
        assetTypeId: newAsset.assetTypeId,
        itemNumber: newAsset.itemNumber || null,
        brand: newAsset.brand || null,
        remarks: newAsset.remarks || null,
      })
      toast.success('Asset created')
      setNewAsset((p) => ({ ...p, itemNumber: '', brand: '', remarks: '' }))
      await load(centerId)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create asset')
    }
  }

  const updateStatus = async (id: number, status: string) => {
    try {
      await assetsApi.updateAsset(id, { status, remarks: null })
      setAssets((prev) => prev.map(a => a.id === id ? { ...a, status } : a))
      toast.success('Updated')
    } catch {
      toast.error('Failed to update')
    }
  }

  return (
    <AdminLayout title="Assets">
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="font-semibold text-gray-800">Generic materials inventory</div>
              <div className="text-sm text-gray-500">Create asset types (Wheelchair, Stretcher, etc.) and add items.</div>
            </div>
            <div className="w-full sm:w-64">
              <select className="input" value={centerId ?? ''} onChange={(e) => setCenterId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Select center...</option>
                {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card space-y-3">
            <div className="flex items-center gap-2 font-semibold text-gray-800">
              <Wrench size={18} /> Asset Types
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input className="input" placeholder="code (e.g. wheelchair)" value={newType.code} onChange={(e) => setNewType(p => ({ ...p, code: e.target.value }))} />
              <input className="input" placeholder="name (Wheelchair)" value={newType.name} onChange={(e) => setNewType(p => ({ ...p, name: e.target.value }))} />
              <select className="input" value={newType.trackingMode} onChange={(e) => setNewType(p => ({ ...p, trackingMode: e.target.value }))}>
                <option value="Individual">Individual</option>
                <option value="Group">Group</option>
              </select>
            </div>
            <button onClick={createType} className="btn-primary flex items-center justify-center gap-2">
              <Plus size={16} /> Create Type
            </button>

            <div className="text-sm text-gray-600">
              {types.length} types
            </div>
            <div className="space-y-2">
              {types.map(t => (
                <div key={t.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.code} · {t.trackingMode}</div>
                  </div>
                </div>
              ))}
              {types.length === 0 && <div className="text-sm text-gray-500">No asset types yet.</div>}
            </div>
          </div>

          <div className="card space-y-3">
            <div className="font-semibold text-gray-800">Add Asset Item</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select className="input" value={newAsset.assetTypeId || ''} onChange={(e) => setNewAsset(p => ({ ...p, assetTypeId: Number(e.target.value) }))}>
                <option value="">Select type...</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input className="input" placeholder="Item number (optional)" value={newAsset.itemNumber} onChange={(e) => setNewAsset(p => ({ ...p, itemNumber: e.target.value }))} />
              <input className="input" placeholder="Brand (optional)" value={newAsset.brand} onChange={(e) => setNewAsset(p => ({ ...p, brand: e.target.value }))} />
              <input className="input" placeholder="Remarks (optional)" value={newAsset.remarks} onChange={(e) => setNewAsset(p => ({ ...p, remarks: e.target.value }))} />
            </div>
            <button onClick={createAsset} className="btn-primary flex items-center justify-center gap-2">
              <Save size={16} /> Add Asset
            </button>

            <div className="text-sm text-gray-600 mt-2">{assets.length} items</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Item#</th>
                    <th className="py-2 pr-3">Brand</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAssets.map(a => (
                    <tr key={a.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-3">{a.assetTypeName}</td>
                      <td className="py-2 pr-3">{a.itemNumber || '-'}</td>
                      <td className="py-2 pr-3">{a.brand || '-'}</td>
                      <td className="py-2 pr-3">{a.status}</td>
                      <td className="py-2 pr-3">
                        <div className="flex gap-2">
                          <button className="btn-secondary" onClick={() => updateStatus(a.id, 'Available')}>Available</button>
                          <button className="btn-secondary" onClick={() => updateStatus(a.id, 'Broken')}>Broken</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visibleAssets.length === 0 && (
                    <tr><td className="py-6 text-center text-gray-500" colSpan={5}>No assets yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

