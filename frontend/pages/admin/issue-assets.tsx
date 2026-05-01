import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import SearchDropdown from '../../components/SearchDropdown'
import { assetsApi, issuesApi, productConfigApi, sewadaarsApi, tenantsApi, visitsApi } from '../../services/api'
import { getActiveVisits, getLatestActiveVisit } from '../../utils/visits'
import { QrCode, X } from 'lucide-react'

type Center = { id: number; name: string; isActive: boolean }
type Visit = any
type Sewadaar = any
type AssetType = { id: number; centerId: number; code: string; name: string; trackingMode: string; isActive: boolean }
type Asset = { id: number; assetTypeId: number; assetTypeCode: string; assetTypeName: string; itemNumber: string | null; brand: string | null; status: string; remarks: string | null }

/**
 * IssueAssetsPage
 *
 * Allows admins to issue assets to a sewadaar for a specific visit.
 *
 * QR scan flow (new):
 *   When the page is opened with ?qr=<AST-value> (redirected from /set/[number]
 *   for logged-in users), it resolves the asset via scanQr(), then:
 *     - Sets the center to the asset's centerId
 *     - Sets the asset type to the asset's typeId
 *     - Pre-selects the scanned asset in the available items list
 *     - Shows a dismissable "Pre-filled from QR scan" banner
 *   The user only needs to pick a sewadaar and optionally add remarks.
 */
export default function IssueAssetsPage() {
  const router = useRouter()
  const [centers, setCenters] = useState<Center[]>([])
  const [centerId, setCenterId] = useState<number | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [visitId, setVisitId] = useState<string>('')
  const [incharges, setIncharges] = useState<Sewadaar[]>([])
  const [inchargeId, setInchargeId] = useState<string>('')

  const [types, setTypes] = useState<AssetType[]>([])
  const [typeId, setTypeId] = useState<number | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [selected, setSelected] = useState<Asset[]>([])
  const [isGroupIssue, setIsGroupIssue] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupCount, setGroupCount] = useState<number>(0)
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sendSms, setSendSms] = useState(true)
  const [qrInput, setQrInput] = useState('')
  const [assetSearch, setAssetSearch] = useState('')
  const [qrPresetLabel, setQrPresetLabel] = useState<string | null>(null)

  // Holds the asset id to auto-select once the assets list loads
  const presetAssetIdRef = useRef<number | null>(null)

  useEffect(() => {
    // Load centers, visits, sewadaars and SMS config on mount.
    // Defaults: user's preferred center, latest active visit.
    Promise.all([
      tenantsApi.getCenters(),
      visitsApi.getAll(),
      sewadaarsApi.getAll(),
      productConfigApi.get(),
    ]).then(([c, v, i]) => {
      const cs = (c.data || []).filter((x: any) => x.isActive)
      setCenters(cs)
      const stored = JSON.parse(localStorage.getItem('user') || 'null')
      const preferred = stored?.centerId
      setCenterId(preferred || cs[0]?.id || null)

      const activeVisits = getActiveVisits(v.data)
      setVisits(activeVisits)
      const latest = getLatestActiveVisit(v.data)
      if (latest) setVisitId(String(latest.id))

      setIncharges((i.data || []).filter((x: any) => x.isActive))
    }).catch(() => toast.error('Failed to load data'))
  }, [])

  useEffect(() => {
    productConfigApi.get().then((res) => {
      const role = JSON.parse(localStorage.getItem('user') || 'null')?.role || ''
      const roleDefault = (res.data?.roleDefaults || []).find((x: any) => x.role === role)
      setSendSms(roleDefault ? !!roleDefault.smsEnabled : true)
    }).catch(() => toast.error('Failed to load data'))
  }, [])
  
  // ── QR pre-fill: when ?qr= is in the URL, auto-select center/type/asset ──────
  useEffect(() => {
    const qr = router.query.qr as string | undefined
    if (!qr) return
    assetsApi.scanQr(qr).then((res) => {
      const a = res.data
      if (a.status !== 'Available') {
        toast.error(`Asset is ${a.status.toLowerCase()} and cannot be issued`)
        return
      }
      presetAssetIdRef.current = a.id
      setQrPresetLabel(`${a.assetTypeName}${a.itemNumber ? ' #' + a.itemNumber : ''}${a.brand ? ' · ' + a.brand : ''}`)
      setCenterId(a.centerId)
      setTypeId(a.assetTypeId)
    }).catch(() => toast.error('Could not resolve scanned QR asset'))
  }, [router.query.qr])

  const addByQr = async () => {
    // Manual QR input on the issue page: scan or paste a QR value to add an asset.
    const raw = qrInput.trim()
    if (!raw) return
    try {
      const res = await assetsApi.scanQr(raw)
      const a = res.data
      if (a.status !== 'Available') { toast.error('Asset is not available'); return }
      if (typeId && a.assetTypeId !== typeId) setTypeId(a.assetTypeId)
      setSelected((prev) => prev.some(x => x.id === a.id) ? prev : [...prev, a])
      setQrInput('')
      toast.success('Asset added by QR')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Invalid QR')
    }
  }


  useEffect(() => {
    if (!centerId) return
    assetsApi.getTypes(centerId).then((res) => {
      const list = (res.data || []).filter((x: any) => x.isActive)
      setTypes(list)
      if (!typeId && list.length) setTypeId(list[0].id)
    }).catch(() => setTypes([]))
  }, [centerId])

  useEffect(() => {
    // Reload available assets whenever center or type changes.
    // If a preset asset id is pending (set by the QR effect), auto-select it
    // once the list loads, then clear the ref so normal navigation resets cleanly.
    if (!centerId || !typeId) { setAssets([]); setSelected([]); return }
    assetsApi.getAssets(centerId, typeId, 'Available').then((res) => {
      const list: Asset[] = res.data || []
      setAssets(list)
      if (presetAssetIdRef.current !== null) {
        const found = list.find(x => x.id === presetAssetIdRef.current)
        setSelected(found ? [found] : [])
        presetAssetIdRef.current = null
      } else {
        setSelected([])
      }
    }).catch(() => setAssets([]))
  }, [centerId, typeId])

  const currentType = useMemo(() => types.find(t => t.id === typeId) || null, [types, typeId])

  const toggle = (a: Asset) => {
    if (selected.find(x => x.id === a.id)) setSelected(prev => prev.filter(x => x.id !== a.id))
    else setSelected(prev => [...prev, a])
  }

  const submit = async () => {
    const parsedVisitId = Number(visitId)
    const parsedInchargeId = Number(inchargeId)
    if (!Number.isFinite(parsedVisitId) || parsedVisitId <= 0 || !Number.isFinite(parsedInchargeId) || parsedInchargeId <= 0) {
      toast.error('Select visit and sewadaar')
      return
    }
    if (!currentType) { toast.error('Select asset type'); return }
    if (!isGroupIssue && selected.length === 0) { toast.error('Select at least one asset'); return }

    setSubmitting(true)
    try {
      const items = selected.map((a) => ({
        itemType: currentType.code,
        assetId: a.id,
      }))

      const payload: any = {
        visitId: parsedVisitId,
        inchargeId: parsedInchargeId,
        isGroupIssue,
        groupName: isGroupIssue ? groupName : undefined,
        groupSetCount: isGroupIssue ? groupCount : undefined,
        remarks,
        sendSms,
        items,
      }

      await issuesApi.create(payload)
      toast.success('Assets issued successfully')
      setSelected([])
      setIsGroupIssue(false)
      setGroupName('')
      setGroupCount(0)
      setRemarks('')
      if (centerId && typeId) {
        const res = await assetsApi.getAssets(centerId, typeId, 'Available')
        setAssets(res.data || [])
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to issue assets')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminLayout title="Issue Assets">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {qrPresetLabel && (
            <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
              <QrCode size={18} className="text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pre-filled from QR scan</div>
                <div className="font-semibold text-gray-800 truncate">{qrPresetLabel}</div>
              </div>
              <button className="ml-auto text-gray-400 hover:text-gray-600 shrink-0" onClick={() => { setQrPresetLabel(null); setSelected([]) }}><X size={16} /></button>
            </div>
          )}
          <div className="card space-y-4">
            <h3 className="font-semibold text-gray-700 border-b pb-2">Issue Details</h3>

            <div>
              <label className="label">Center</label>
              <select className="input" value={centerId ?? ''} onChange={(e) => setCenterId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Select center...</option>
                {centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Visit *</label>
              <select className="input" value={visitId} onChange={(e) => setVisitId(e.target.value)}>
                <option value="">— Select Visit —</option>
                {visits.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Sewadaar *</label>
              <SearchDropdown
                items={incharges}
                value={inchargeId}
                onChange={(val) => setInchargeId(String(val))}
                getLabel={(i) => `${i.name} (${i.badgeNumber})`}
                getValue={(i) => i.id}
                placeholder="Search sewadaar by name or badge..."
                className="input"
              />
            </div>

            <div>
              <label className="label">Asset Type *</label>
              <select className="input" value={typeId ?? ''} onChange={(e) => setTypeId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Select type...</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name} ({t.trackingMode})</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" checked={isGroupIssue} onChange={(e) => setIsGroupIssue(e.target.checked)} className="w-4 h-4" />
              <label className="text-sm font-medium text-gray-700">Group Issue</label>
            </div>

            {isGroupIssue && (
              <div className="grid grid-cols-2 gap-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div>
                  <label className="label">Group Name</label>
                  <input className="input" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g. Gate Team" />
                </div>
                <div>
                  <label className="label">Count</label>
                  <input className="input" type="number" value={groupCount || ''} onChange={(e) => setGroupCount(parseInt(e.target.value || '0'))} placeholder="10" />
                </div>
              </div>
            )}

            <div>
              <label className="label">Remarks</label>
              <textarea className="input h-16 resize-none" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks..." />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sendSms} onChange={(e) => setSendSms(e.target.checked)} />
              Send SMS notification
            </label>

            <button disabled={submitting} onClick={submit} className="btn-primary w-full">
              {submitting ? 'Issuing...' : 'Issue Assets'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">Available Items</h3>
              <div className="text-sm text-gray-500">Selected: {selected.length}</div>
            </div>
            <div className="flex gap-2 mb-3">
              <input className="input" value={qrInput} onChange={(e) => setQrInput(e.target.value)} placeholder="Scan or paste asset QR value..." />
              <button className="btn-secondary" type="button" onClick={addByQr}>Add by QR</button>
            </div>

            <div className="mb-3">
              <input
                className="input"
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                placeholder="Search by item number or type..."
              />
            </div>

            {assets.length === 0 ? (
              <div className="text-sm text-gray-500">No available assets found for this type.</div>
            ) : (
              <div className="space-y-2">
                {assets
                  .filter(a => {
                    const q = assetSearch.toLowerCase()
                    return !q || (a.itemNumber || '').toLowerCase().includes(q) || a.assetTypeName.toLowerCase().includes(q) || (a.brand || '').toLowerCase().includes(q)
                  })
                  .map(a => {
                  const active = !!selected.find(x => x.id === a.id)
                  return (
                    <button key={a.id} type="button" onClick={() => toggle(a)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${active ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-gray-800 truncate">{a.itemNumber || a.assetTypeName}</div>
                          <div className="text-xs text-gray-500 truncate">{a.brand || a.assetTypeCode}</div>
                        </div>
                        {active && <X size={16} className="text-primary" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

