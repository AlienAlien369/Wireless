import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { visitsApi, inchargesApi, inventoryApi, issuesApi } from '../../services/api'
import { getActiveVisits, getLatestActiveVisit } from '../../utils/visits'
import { AlertCircle, CheckCircle, AlertTriangle, X } from 'lucide-react'

interface ProcessedItem {
  id: string
  itemNumber: string
  requestedInchargeName: string
  inchargeId?: number
  status: 'ready' | 'already_issued' | 'broken' | 'not_found' | 'incharge_not_found'
  currentInchargeName?: string
  issueId?: number
  message?: string
}

export default function BulkIssuePage() {
  const [visits, setVisits] = useState<any[]>([])
  const [incharges, setIncharges] = useState<any[]>([])
  const [allSets, setAllSets] = useState<any[]>([])
  const [allChargers, setAllChargers] = useState<any[]>([])
  const [allKits, setAllKits] = useState<any[]>([])
  
  const [bulkText, setBulkText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  
  const { register, handleSubmit, watch, setValue } = useForm<any>({ 
    defaultValues: { sendSms: true } 
  })
  const selectedVisitId = watch('visitId')

  useEffect(() => {
    visitsApi.getAll().then(r => {
      const activeVisits = getActiveVisits(r.data)
      setVisits(activeVisits)

      const latestVisit = getLatestActiveVisit(r.data)
      if (latestVisit) {
        setValue('visitId', latestVisit.id.toString())
      }
    })
    inchargesApi.getAll().then(r => setIncharges(r.data.filter((i: any) => i.isActive)))
    inventoryApi.getSets().then(r => setAllSets(r.data))
    inventoryApi.getChargers().then(r => setAllChargers(r.data))
    inventoryApi.getKits().then(r => setAllKits(r.data))
  }, [setValue])

  const parseItemNumbers = async () => {
    if (!selectedVisitId) {
      toast.error('Select a visit first')
      return
    }

    setProcessing(true)
    try {
      const lines = bulkText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)

      const items: ProcessedItem[] = []

      for (const line of lines) {
        // Parse format: KW-01(Incharge Name) or KW-01, KW-02
        const match = line.match(/^([^()]+)\(([^)]+)\)$/)
        
        if (!match) {
          items.push({
            id: Math.random().toString(),
            itemNumber: line,
            requestedInchargeName: '',
            status: 'not_found',
            message: 'Invalid format. Use: KW-01(Incharge Name)'
          })
          continue
        }

        const itemNumber = match[1].trim()
        const inchargeName = match[2].trim()

        // Find item in inventory
        let foundItem: any = null
        let itemType: 'set' | 'charger' | 'kit' | null = null

        const set = allSets.find(s => s.itemNumber?.toLowerCase() === itemNumber.toLowerCase())
        if (set) { foundItem = set; itemType = 'set' }

        const charger = allChargers.find(c => c.itemNumber?.toLowerCase() === itemNumber.toLowerCase())
        if (!foundItem && charger) { foundItem = charger; itemType = 'charger' }

        const kit = allKits.find(k => k.itemNumber?.toLowerCase() === itemNumber.toLowerCase())
        if (!foundItem && kit) { foundItem = kit; itemType = 'kit' }

        if (!foundItem) {
          items.push({
            id: Math.random().toString(),
            itemNumber,
            requestedInchargeName: inchargeName,
            status: 'not_found',
            message: 'Item not found in inventory'
          })
          continue
        }

        // Check if incharge exists
        const incharge = incharges.find(i => i.name?.toLowerCase() === inchargeName.toLowerCase())
        if (!incharge) {
          items.push({
            id: Math.random().toString(),
            itemNumber,
            requestedInchargeName: inchargeName,
            status: 'incharge_not_found',
            message: `Incharge "${inchargeName}" not found in system`
          })
          continue
        }

        // Check current status
        if (foundItem.status === 'Broken') {
          items.push({
            id: Math.random().toString(),
            itemNumber,
            requestedInchargeName: inchargeName,
            inchargeId: incharge.id,
            status: 'broken',
            message: 'Item is broken'
          })
          continue
        }

        if (foundItem.status === 'Issued') {
          let currentIncharge: string | undefined
          let issueId: number | undefined
          
          try {
            const allIssues = await issuesApi.getByVisit(parseInt(selectedVisitId))
            const issues = allIssues.data || []
            
            // Find if this item is in any issue in this visit
            const issue = issues.find((i: any) =>
              i.items?.some((item: any) => {
                if (itemType === 'set') return item.wirelessSetId === foundItem.id
                if (itemType === 'charger') return item.chargerId === foundItem.id
                if (itemType === 'kit') return item.kitId === foundItem.id
                return false
              })
            )

            if (issue) {
              const issueIncharge = incharges.find(ic => ic.id === issue.inchargeId)
              currentIncharge = issueIncharge?.name
              issueId = issue.id
            }
          } catch (e) {
            console.error('Error checking issues:', e)
          }

          items.push({
            id: Math.random().toString(),
            itemNumber,
            requestedInchargeName: inchargeName,
            inchargeId: incharge.id,
            status: 'already_issued',
            currentInchargeName: currentIncharge,
            issueId: issueId,
            message: currentIncharge ? `Already issued to ${currentIncharge}` : 'Already issued (may be from previous visit)'
          })
          continue
        }

        // Ready to issue
        items.push({
          id: Math.random().toString(),
          itemNumber,
          requestedInchargeName: inchargeName,
          inchargeId: incharge.id,
          status: 'ready'
        })
      }

      setProcessedItems(items)
      toast.success(`Parsed ${lines.length} items`)
    } catch (e: any) {
      toast.error('Failed to parse items')
    } finally {
      setProcessing(false)
    }
  }

  const updateItemIncharge = (itemId: string, inchargeId: number | undefined) => {
    setProcessedItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, inchargeId } : item
    ))
  }

  const onSubmit = async (data: any) => {
    if (!data.visitId) {
      toast.error('Select a visit')
      return
    }

    const readyItems = processedItems.filter(item => item.status === 'ready' && item.inchargeId)
    if (readyItems.length === 0) {
      toast.error('No items ready to issue')
      return
    }

    setSubmitting(true)
    try {
      let successCount = 0
      let errorCount = 0

      for (const item of readyItems) {
        try {
          let foundItem = allSets.find(s => s.itemNumber?.toLowerCase() === item.itemNumber.toLowerCase())
          let itemType = 'WirelessSet'
          let itemId = 'wirelessSetId'

          if (!foundItem) {
            foundItem = allChargers.find(c => c.itemNumber?.toLowerCase() === item.itemNumber.toLowerCase())
            itemType = 'Charger'
            itemId = 'chargerId'
          }

          if (!foundItem) {
            foundItem = allKits.find(k => k.itemNumber?.toLowerCase() === item.itemNumber.toLowerCase())
            itemType = 'Kit'
            itemId = 'kitId'
          }

          if (!foundItem) {
            errorCount++
            continue
          }

          const payload = {
            visitId: parseInt(data.visitId),
            inchargeId: item.inchargeId,
            isGroupIssue: false,
            remarks: `Bulk issued: ${item.itemNumber} to ${item.requestedInchargeName}`,
            sendSms: data.sendSms,
            items: [{ itemType, [itemId]: foundItem.id }],
          }

          await issuesApi.create(payload)
          successCount++
        } catch (e: any) {
          errorCount++
        }
      }

      toast.success(`${successCount} items issued successfully! ${errorCount > 0 ? errorCount + ' failed' : ''}`)

      inventoryApi.getSets().then(r => setAllSets(r.data))
      inventoryApi.getChargers().then(r => setAllChargers(r.data))
      inventoryApi.getKits().then(r => setAllKits(r.data))

      const issuedItems = readyItems.map(i => `${i.itemNumber}(${i.requestedInchargeName})`).join('\n')
      setBulkText(issuedItems)
      setProcessedItems([])
    } catch (e: any) {
      toast.error('Failed to process bulk issue')
    } finally {
      setSubmitting(false)
    }
  }

  const readyCount = processedItems.filter(p => p.status === 'ready').length
  const alreadyIssuedCount = processedItems.filter(p => p.status === 'already_issued').length
  const brokenCount = processedItems.filter(p => p.status === 'broken').length
  const inchargeNotFoundCount = processedItems.filter(p => p.status === 'incharge_not_found').length
  const notFoundCount = processedItems.filter(p => p.status === 'not_found').length

  return (
    <AdminLayout title="Bulk Issue Wireless">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Issue Details */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card space-y-4">
              <h3 className="font-semibold text-gray-700 border-b pb-2">Issue Details</h3>

              <div>
                <label className="label">Visit *</label>
                <select {...register('visitId', { required: true })} className="input">
                  <option value="">— Select Visit —</option>
                  {visits.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="sendSms" {...register('sendSms')} className="w-4 h-4" defaultChecked />
                <label htmlFor="sendSms" className="text-sm text-gray-600">Send SMS to incharge</label>
              </div>
            </div>

            {/* Summary Stats */}
            {processedItems.length > 0 && (
              <div className="card space-y-2">
                <h3 className="font-semibold text-gray-700 text-sm">Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-green-50 p-2 rounded border border-green-200">
                    <div className="font-bold text-green-700">{readyCount}</div>
                    <div className="text-xs text-green-600">Ready to Issue</div>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                    <div className="font-bold text-yellow-700">{alreadyIssuedCount}</div>
                    <div className="text-xs text-yellow-600">Already Issued</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded border border-red-200">
                    <div className="font-bold text-red-700">{brokenCount}</div>
                    <div className="text-xs text-red-600">Broken</div>
                  </div>
                  <div className="bg-orange-50 p-2 rounded border border-orange-200">
                    <div className="font-bold text-orange-700">{inchargeNotFoundCount}</div>
                    <div className="text-xs text-orange-600">Incharge Not Found</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Bulk Input & Results */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <label className="label mb-3">Item Numbers to Issue</label>
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder="Format: ItemNumber(Incharge Name)
Example:
KW-001(Raj Kumar)
KW-002(Priya Singh)
KW-003(Amit Patel)"
                className="input resize-none h-32 font-mono text-sm"
              />
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={parseItemNumbers}
                  disabled={processing || !bulkText.trim()}
                  className="flex-1 btn-secondary disabled:opacity-50"
                >
                  {processing ? 'Parsing...' : 'Parse & Check Status'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBulkText('')
                    setProcessedItems([])
                  }}
                  className="px-4 btn-secondary"
                >
                  Clear
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Separate by line breaks or commas</p>
            </div>

            {/* Processing Results - Table View */}
            {processedItems.length > 0 && (
              <div className="card space-y-3">
                <h3 className="font-semibold text-gray-700 mb-3">Processing Results</h3>
                
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs mb-3">
                  <div className="bg-green-50 p-2 rounded border border-green-200">
                    <div className="font-bold text-green-700">{readyCount}</div>
                    <div className="text-green-600">Ready to Issue</div>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                    <div className="font-bold text-yellow-700">{alreadyIssuedCount}</div>
                    <div className="text-yellow-600">Already Issued</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded border border-red-200">
                    <div className="font-bold text-red-700">{brokenCount}</div>
                    <div className="text-red-600">Broken</div>
                  </div>
                  <div className="bg-orange-50 p-2 rounded border border-orange-200">
                    <div className="font-bold text-orange-700">{inchargeNotFoundCount}</div>
                    <div className="text-orange-600">Incharge Not Found</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded border border-gray-200">
                    <div className="font-bold text-gray-700">{notFoundCount}</div>
                    <div className="text-gray-600">Not Found</div>
                  </div>
                </div>

                {/* Results Table */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Item Number</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Requested Incharge</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Current Incharge</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {processedItems.map((item) => {
                        let bgColor = 'bg-white'
                        let statusColor = 'text-gray-600'
                        let statusBg = 'bg-gray-100'

                        if (item.status === 'ready') {
                          bgColor = 'bg-green-50 hover:bg-green-100'
                          statusColor = 'text-green-700'
                          statusBg = 'bg-green-100'
                        } else if (item.status === 'already_issued') {
                          bgColor = 'bg-yellow-50 hover:bg-yellow-100'
                          statusColor = 'text-yellow-700'
                          statusBg = 'bg-yellow-100'
                        } else if (item.status === 'broken') {
                          bgColor = 'bg-red-50 hover:bg-red-100'
                          statusColor = 'text-red-700'
                          statusBg = 'bg-red-100'
                        } else if (item.status === 'incharge_not_found') {
                          bgColor = 'bg-orange-50 hover:bg-orange-100'
                          statusColor = 'text-orange-700'
                          statusBg = 'bg-orange-100'
                        } else if (item.status === 'not_found') {
                          bgColor = 'bg-gray-50 hover:bg-gray-100'
                          statusColor = 'text-gray-600'
                          statusBg = 'bg-gray-100'
                        }

                        const statusLabels: Record<string, string> = {
                          'ready': '✓ Ready',
                          'already_issued': '⚠ Already Issued',
                          'broken': '✗ Broken',
                          'incharge_not_found': '✗ Incharge Not Found',
                          'not_found': '✗ Not Found'
                        }

                        return (
                          <tr key={item.id} className={bgColor}>
                            <td className="px-4 py-2 font-medium text-gray-800">{item.itemNumber}</td>
                            <td className="px-4 py-2 text-gray-700">{item.requestedInchargeName}</td>
                            <td className="px-4 py-2 text-gray-700">{item.currentInchargeName || '-'}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor} ${statusBg}`}>
                                {statusLabels[item.status]}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-600 text-xs">{item.message || '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Submit Button */}
            {readyCount > 0 && (
              <button
                type="submit"
                disabled={submitting || readyCount === 0}
                className="w-full btn-primary py-3 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? 'Processing...' : `Issue ${readyCount} Item${readyCount !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </div>
      </form>
    </AdminLayout>
  )
}

