import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { visitsApi, inchargesApi, inventoryApi, issuesApi } from '../../services/api'

export default function IssuePage() {
  const [visits, setVisits] = useState<any[]>([])
  const [incharges, setIncharges] = useState<any[]>([])
  const [availableSets, setAvailableSets] = useState<any[]>([])
  const [availableChargers, setAvailableChargers] = useState<any[]>([])
  const [availableKits, setAvailableKits] = useState<any[]>([])
  const [selectedSets, setSelectedSets] = useState<any[]>([])
  const [selectedChargers, setSelectedChargers] = useState<any[]>([])
  const [selectedKits, setSelectedKits] = useState<any[]>([])
  const [isGroupIssue, setIsGroupIssue] = useState(false)
  const [hasCollector, setHasCollector] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const { register, handleSubmit, watch, reset } = useForm<any>({ defaultValues: { sendSms: true } })
  const selectedBrand = watch('brand')

  useEffect(() => {
    visitsApi.getAll().then(r => setVisits(r.data.filter((v: any) => v.isActive)))
    inchargesApi.getAll().then(r => setIncharges(r.data.filter((i: any) => i.isActive)))
    inventoryApi.getSets({ status: 'Available' }).then(r => setAvailableSets(r.data))
    inventoryApi.getChargers().then(r => setAvailableChargers(r.data.filter((c: any) => c.status === 'Available')))
    inventoryApi.getKits().then(r => setAvailableKits(r.data.filter((k: any) => k.status === 'Available')))
  }, [])

  const filteredSets = selectedBrand ? availableSets.filter((s: any) => s.brand === selectedBrand) : availableSets

  const toggleSet = (s: any) => {
    if (selectedSets.find(x => x.id === s.id)) setSelectedSets(prev => prev.filter(x => x.id !== s.id))
    else setSelectedSets(prev => [...prev, s])
  }

  const onSubmit = async (data: any) => {
    if (!data.visitId || !data.inchargeId) { toast.error('Select visit and incharge'); return }
    if (!isGroupIssue && selectedSets.length === 0) { toast.error('Select at least one set'); return }

    setSubmitting(true)
    try {
      const items = [
        ...selectedSets.map(s => ({ itemType: 'WirelessSet', wirelessSetId: s.id })),
        ...selectedChargers.map(c => ({ itemType: 'Charger', chargerId: c.id })),
        ...selectedKits.map(k => ({ itemType: 'Kit', kitId: k.id })),
      ]

      const payload: any = {
        visitId: parseInt(data.visitId),
        inchargeId: parseInt(data.inchargeId),
        isGroupIssue,
        groupName: isGroupIssue ? data.groupName : undefined,
        groupSetCount: isGroupIssue ? parseInt(data.groupSetCount) : undefined,
        remarks: data.remarks,
        sendSms: data.sendSms,
        items,
      }

      if (hasCollector) {
        payload.collector = {
          name: data.collectorName,
          badgeNumber: data.collectorBadge,
          phoneNumber: data.collectorPhone,
        }
      }

      const res = await issuesApi.create(payload)

      if (photoFile) {
        await issuesApi.uploadPhoto(res.data.id, photoFile)
      }

      toast.success('Wireless sets issued successfully!')
      reset()
      setSelectedSets([]); setSelectedChargers([]); setSelectedKits([])
      setIsGroupIssue(false); setHasCollector(false); setPhotoFile(null)
      // Reload available
      inventoryApi.getSets({ status: 'Available' }).then(r => setAvailableSets(r.data))
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to issue')
    } finally { setSubmitting(false) }
  }

  return (
    <AdminLayout title="Issue Wireless">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Issue Details */}
          <div className="space-y-4">
            <div className="card space-y-4">
              <h3 className="font-semibold text-gray-700 border-b pb-2">Issue Details</h3>

              <div>
                <label className="label">Visit *</label>
                <select {...register('visitId', { required: true })} className="input">
                  <option value="">— Select Visit —</option>
                  {visits.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Incharge *</label>
                <select {...register('inchargeId', { required: true })} className="input">
                  <option value="">— Select Incharge —</option>
                  {incharges.map(i => <option key={i.id} value={i.id}>{i.name} ({i.badgeNumber})</option>)}
                </select>
              </div>

              <div>
                <label className="label">Brand Filter</label>
                <select {...register('brand')} className="input">
                  <option value="">All Brands</option>
                  <option>Kenwood</option><option>Vertel</option><option>Aspera</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="groupIssue" checked={isGroupIssue} onChange={e => setIsGroupIssue(e.target.checked)} className="w-4 h-4" />
                <label htmlFor="groupIssue" className="text-sm font-medium text-gray-700">Group Issue (Vertel / Aspera)</label>
              </div>

              {isGroupIssue && (
                <div className="grid grid-cols-2 gap-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div>
                    <label className="label">Group Name</label>
                    <input {...register('groupName')} className="input" placeholder="e.g. Pandal Gate Team" />
                  </div>
                  <div>
                    <label className="label">Number of Sets</label>
                    <input {...register('groupSetCount')} type="number" className="input" placeholder="10" />
                  </div>
                </div>
              )}

              <div>
                <label className="label">Remarks</label>
                <textarea {...register('remarks')} className="input h-16 resize-none" placeholder="Optional remarks..." />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="sendSms" {...register('sendSms')} className="w-4 h-4" defaultChecked />
                <label htmlFor="sendSms" className="text-sm text-gray-600">Send SMS to incharge</label>
              </div>
            </div>

            {/* Collector */}
            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="collector" checked={hasCollector} onChange={e => setHasCollector(e.target.checked)} className="w-4 h-4" />
                <h3 className="font-semibold text-gray-700">Collection by Another Sewadar?</h3>
              </div>
              {hasCollector && (
                <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div>
                    <label className="label">Collector Name</label>
                    <input {...register('collectorName')} className="input" placeholder="Name" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Badge Number</label>
                      <input {...register('collectorBadge')} className="input" placeholder="B-XXX" />
                    </div>
                    <div>
                      <label className="label">Phone Number</label>
                      <input {...register('collectorPhone')} className="input" placeholder="+91..." />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Photo Upload */}
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-3">Photo Proof (Optional)</h3>
              <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)}
                className="text-sm text-gray-600" />
              {photoFile && <p className="text-xs text-green-600 mt-1">Photo selected: {photoFile.name}</p>}
            </div>
          </div>

          {/* Right: Equipment Selection */}
          <div className="space-y-4">
            {!isGroupIssue && (
              <>
                {/* Wireless Sets */}
                <div className="card">
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Select Wireless Sets
                    {selectedSets.length > 0 && <span className="ml-2 badge-available">{selectedSets.length} selected</span>}
                  </h3>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredSets.map(s => (
                      <label key={s.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-colors
                        ${selectedSets.find(x => x.id === s.id) ? 'bg-primary/10 border-primary' : 'border-transparent hover:bg-gray-50'}`}>
                        <input type="checkbox" checked={!!selectedSets.find(x => x.id === s.id)}
                          onChange={() => toggleSet(s)} className="w-4 h-4" />
                        <span className="font-medium text-sm">{s.itemNumber}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${s.brand === 'Kenwood' ? 'bg-blue-100 text-blue-700' : s.brand === 'Vertel' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{s.brand}</span>
                      </label>
                    ))}
                    {filteredSets.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No available sets</p>}
                  </div>
                </div>

                {/* Chargers */}
                <div className="card">
                  <h3 className="font-semibold text-gray-700 mb-3">Select Chargers (Optional)</h3>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {availableChargers.map(c => (
                      <label key={c.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-colors
                        ${selectedChargers.find(x => x.id === c.id) ? 'bg-primary/10 border-primary' : 'border-transparent hover:bg-gray-50'}`}>
                        <input type="checkbox" checked={!!selectedChargers.find(x => x.id === c.id)}
                          onChange={() => setSelectedChargers(prev => prev.find(x => x.id === c.id) ? prev.filter(x => x.id !== c.id) : [...prev, c])}
                          className="w-4 h-4" />
                        <span className="font-medium text-sm">{c.itemNumber || '(no #)'}</span>
                        <span className="text-xs text-gray-500">{c.brand}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Kits */}
                <div className="card">
                  <h3 className="font-semibold text-gray-700 mb-3">Select Kits/Earphones (Kenwood only)</h3>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {availableKits.map(k => (
                      <label key={k.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-colors
                        ${selectedKits.find(x => x.id === k.id) ? 'bg-primary/10 border-primary' : 'border-transparent hover:bg-gray-50'}`}>
                        <input type="checkbox" checked={!!selectedKits.find(x => x.id === k.id)}
                          onChange={() => setSelectedKits(prev => prev.find(x => x.id === k.id) ? prev.filter(x => x.id !== k.id) : [...prev, k])}
                          className="w-4 h-4" />
                        <span className="font-medium text-sm">{k.itemNumber}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Summary */}
            <div className="card bg-primary/5 border-primary/20">
              <h3 className="font-semibold text-gray-700 mb-3">Issue Summary</h3>
              <div className="text-sm space-y-1 text-gray-600">
                {isGroupIssue
                  ? <p>Group issue mode — specific sets not tracked</p>
                  : <>
                    <p>Wireless Sets: <strong>{selectedSets.length}</strong></p>
                    <p>Chargers: <strong>{selectedChargers.length}</strong></p>
                    <p>Kits: <strong>{selectedKits.length}</strong></p>
                  </>
                }
              </div>
              <button type="submit" disabled={submitting}
                className="mt-4 w-full btn-primary disabled:opacity-50">
                {submitting ? 'Issuing...' : 'Confirm Issue'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  )
}
