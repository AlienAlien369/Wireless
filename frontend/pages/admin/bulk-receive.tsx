import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { visitsApi, inchargesApi, inventoryApi, issuesApi } from '../../services/api'

interface ProcessedItem {
  id: string
  itemNumber: string
  requestedInchargeName: string
  inchargeId?: number
  status: 'ready' | 'already_returned' | 'not_issued' | 'not_found' | 'incharge_not_found'
  currentInchargeName?: string
  issueId?: number
  message?: string
}

export default function BulkReceivePage() {
  const [visits, setVisits] = useState<any[]>([])
  const [incharges, setIncharges] = useState<any[]>([])
  const [allSets, setAllSets] = useState<any[]>([])
  const [allChargers, setAllChargers] = useState<any[]>([])
  const [allKits, setAllKits] = useState<any[]>([])
  
  const [selectedVisitId, setSelectedVisitId] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    visitsApi.getAll().then(r => setVisits(r.data.filter((v: any) => v.isActive)))
    inchargesApi.getAll().then(r => setIncharges(r.data.filter((i: any) => i.isActive)))
    inventoryApi.getSets().then(r => setAllSets(r.data))
    inventoryApi.getChargers().then(r => setAllChargers(r.data))
    inventoryApi.getKits().then(r => setAllKits(r.data))
  }, [])

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

      // Get all issues for this visit
      const allIssuesResponse = await issuesApi.getByVisit(parseInt(selectedVisitId))
      const visitIssues = allIssuesResponse.data || []
      
      console.log('Visit Issues:', visitIssues)
      console.log('All Sets:', allSets)
      console.log('Selected Visit ID:', selectedVisitId)

      for (const line of lines) {
        // Parse format: KW-01(Incharge Name)
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

        console.log('Processing:', itemNumber, 'for incharge:', inchargeName)

        // Find item in inventory
        let foundItem: any = null
        let itemType: 'set' | 'charger' | 'kit' | null = null

        const set = allSets.find(s => s.itemNumber?.toLowerCase() === itemNumber.toLowerCase())
        if (set) { foundItem = set; itemType = 'set' }

        const charger = allChargers.find(c => c.itemNumber?.toLowerCase() === itemNumber.toLowerCase())
        if (!foundItem && charger) { foundItem = charger; itemType = 'charger' }

        const kit = allKits.find(k => k.itemNumber?.toLowerCase() === itemNumber.toLowerCase())
        if (!foundItem && kit) { foundItem = kit; itemType = 'kit' }

        console.log('Found Item:', foundItem)

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

        // First, check if this item is in any ACTIVE issue for this visit
        const activeIssue = visitIssues.find((issue: any) => {
          if (issue.status === 'Returned') return false

          const hasItem = issue.items?.some((item: any) => {
            if (itemType === 'set') return item.wirelessSetId === foundItem.id
            if (itemType === 'charger') return item.chargerId === foundItem.id
            if (itemType === 'kit') return item.kitId === foundItem.id
            return false
          })
          
          console.log('Checking issue:', issue.id, 'has item:', hasItem)
          return hasItem
        })

        console.log('Active Issue found:', activeIssue)

        // If found in active issue, it's ready to receive
        if (activeIssue) {
          const incharge = incharges.find(i => i.name?.toLowerCase() === inchargeName.toLowerCase())
          if (!incharge) {
            const issueIncharge = incharges.find(i => i.id === activeIssue.inchargeId)
            items.push({
              id: Math.random().toString(),
              itemNumber,
              requestedInchargeName: inchargeName,
              status: 'incharge_not_found',
              currentInchargeName: issueIncharge?.name,
              issueId: activeIssue.id,
              message: `Incharge "${inchargeName}" not found in system (Currently with: ${issueIncharge?.name || 'Unknown'})`
            })
            continue
          }

          const issueIncharge = incharges.find(i => i.id === activeIssue.inchargeId)
          items.push({
            id: Math.random().toString(),
            itemNumber,
            requestedInchargeName: inchargeName,
            inchargeId: incharge.id,
            status: 'ready',
            currentInchargeName: issueIncharge?.name,
            issueId: activeIssue.id
          })
          continue
        }

        // Check if already returned in this visit
        const returnedIssue = visitIssues.find((issue: any) =>
          issue.status === 'Returned' && issue.items?.some((item: any) => {
            if (itemType === 'set') return item.wirelessSetId === foundItem.id
            if (itemType === 'charger') return item.chargerId === foundItem.id
            if (itemType === 'kit') return item.kitId === foundItem.id
            return false
          })
        )

        if (returnedIssue) {
          const issueIncharge = incharges.find(i => i.id === returnedIssue.inchargeId)
          items.push({
            id: Math.random().toString(),
            itemNumber,
            requestedInchargeName: inchargeName,
            inchargeId: 0,
            status: 'already_returned',
            currentInchargeName: issueIncharge?.name,
            issueId: returnedIssue.id,
            message: `Already received from ${issueIncharge?.name || 'Unknown'}`
          })
          continue
        }

        // Not in any issue in this visit
        items.push({
          id: Math.random().toString(),
          itemNumber,
          requestedInchargeName: inchargeName,
          status: 'not_issued',
          message: 'Not issued in this visit'
        })
      }

      setProcessedItems(items)
      toast.success(`Parsed ${lines.length} items`)
    } catch (e: any) {
      toast.error('Failed to parse items')
      console.error('Parse error:', e)
    } finally {
      setProcessing(false)
    }
  }

  const updateItemIncharge = (itemId: string, inchargeId: number | undefined) => {
    setProcessedItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, inchargeId } : item
    ))
  }

  const submitBulkReceive = async () => {
    const readyItems = processedItems.filter(item => item.status === 'ready' && item.inchargeId)
    if (readyItems.length === 0) {
      toast.error('Select incharges for at least one item')
      return
    }

    setSubmitting(true)
    try {
      let successCount = 0
      let errorCount = 0

      // Get fresh issues data for marking
      const allIssues = await issuesApi.getByVisit(parseInt(selectedVisitId))
      const issues = allIssues.data || []

      // Group items by issue for bulk marking
      const issueMap = new Map<number, ProcessedItem[]>()

      for (const item of readyItems) {
        if (!issueMap.has(item.issueId!)) {
          issueMap.set(item.issueId!, [])
        }
        issueMap.get(item.issueId!)!.push(item)
      }

      // Mark each issue as returned
      const issueEntries = Array.from(issueMap.entries())
      for (let i = 0; i < issueEntries.length; i++) {
        const [issueId, items] = issueEntries[i]
        try {
          // Find the issue
          const issue = issues.find((i: any) => i.id === issueId)
          if (issue && issue.items) {
            // Get IDs of items to return
            const itemIds: number[] = []
            for (const item of items) {
              // Find which item ID corresponds to this item
              const foundItem = allSets.find(s => s.itemNumber?.toLowerCase() === item.itemNumber.toLowerCase())
              if (foundItem) {
                const issueItem = issue.items.find((ii: any) => ii.wirelessSetId === foundItem.id)
                if (issueItem) itemIds.push(issueItem.id)
              } else {
                const charger = allChargers.find(c => c.itemNumber?.toLowerCase() === item.itemNumber.toLowerCase())
                if (charger) {
                  const issueItem = issue.items.find((ii: any) => ii.chargerId === charger.id)
                  if (issueItem) itemIds.push(issueItem.id)
                } else {
                  const kit = allKits.find(k => k.itemNumber?.toLowerCase() === item.itemNumber.toLowerCase())
                  if (kit) {
                    const issueItem = issue.items.find((ii: any) => ii.kitId === kit.id)
                    if (issueItem) itemIds.push(issueItem.id)
                  }
                }
              }
            }

            if (itemIds.length > 0) {
              await issuesApi.return(issueId, itemIds)
              successCount += itemIds.length
            } else {
              errorCount += items.length
            }
          }
        } catch (e: any) {
          errorCount += items.length
          console.error(e)
        }
      }

      // Show summary
      toast.success(`${successCount} items received successfully! ${errorCount > 0 ? errorCount + ' failed' : ''}`)

      // Reload data
      inventoryApi.getSets().then(r => setAllSets(r.data))
      inventoryApi.getChargers().then(r => setAllChargers(r.data))
      inventoryApi.getKits().then(r => setAllKits(r.data))

      // Reset form
      setBulkText('')
      setProcessedItems([])
    } catch (e: any) {
      toast.error('Failed to process bulk receive')
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const clearAll = () => {
    setBulkText('')
    setProcessedItems([])
  }

  const readyCount = processedItems.filter(i => i.status === 'ready' && i.inchargeId).length
  const readyTotal = processedItems.filter(i => i.status === 'ready').length
  const alreadyReturnedCount = processedItems.filter(i => i.status === 'already_returned').length
  const notIssuedCount = processedItems.filter(i => i.status === 'not_issued').length
  const errorCount = processedItems.filter(i => i.status === 'not_found' || i.status === 'incharge_not_found').length

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Bulk Receive Items</h1>
            <p className="text-gray-600 mt-2">
              Scan multiple items with incharge names to bulk receive them
            </p>
          </div>

          {/* Visit Selection */}
          <div className="bg-white rounded-lg border p-4">
            <label className="block text-sm font-medium mb-2">Select Visit</label>
            <select
              value={selectedVisitId}
              onChange={(e) => setSelectedVisitId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a visit...</option>
              {visits.map(visit => (
                <option key={visit.id} value={visit.id}>
                  {visit.name}
                </option>
              ))}
            </select>
          </div>

          {/* Input Section */}
          <div className="bg-white rounded-lg border p-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Paste item numbers (Format: KW-01(Incharge Name))
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Enter one item per line. Example: KW-01(John Doe)
              </p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="KW-01(John Doe)&#10;KW-02(Jane Smith)&#10;CHARGER-001(John Doe)"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={6}
              />
            </div>

            <button
              onClick={parseItemNumbers}
              disabled={processing || !bulkText.trim() || !selectedVisitId}
              className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 ${
                processing || !bulkText.trim() || !selectedVisitId
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {processing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Parsing...
                </>
              ) : (
                'Parse Items'
              )}
            </button>
          </div>

          {/* Processed Items */}
          {processedItems.length > 0 && (
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-lg font-semibold mb-4">
                {processedItems.length} Item(s) Parsed
              </h2>

              <div className="space-y-3">
                {processedItems.map(item => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border ${
                      item.status === 'ready'
                        ? 'border-green-200 bg-green-50'
                        : item.status === 'already_returned'
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-600">Item Number</p>
                        <p className="font-mono font-semibold">{item.itemNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Status</p>
                        <p className={`font-medium ${
                          item.status === 'ready'
                            ? 'text-green-700'
                            : item.status === 'already_returned'
                            ? 'text-blue-700'
                            : 'text-red-700'
                        }`}>
                          {item.status === 'ready' && '✓ Ready'}
                          {item.status === 'already_returned' && '↩ Already Returned'}
                          {item.status === 'not_found' && '✗ Not Found'}
                          {item.status === 'incharge_not_found' && '✗ Incharge Not Found'}
                          {item.status === 'not_issued' && '✗ Not Issued'}
                        </p>
                      </div>
                    </div>

                    {/* Message */}
                    {item.message && (
                      <p className="text-sm text-gray-700 mb-3">{item.message}</p>
                    )}

                    {/* Current Holder */}
                    {item.currentInchargeName && (
                      <p className="text-sm text-gray-600 mb-3">
                        Currently with: <span className="font-medium">{item.currentInchargeName}</span>
                      </p>
                    )}

                    {/* Incharge Selection for Ready Items */}
                    {item.status === 'ready' && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">
                          Assign to Incharge
                        </label>
                        <select
                          value={item.inchargeId || ''}
                          onChange={(e) => updateItemIncharge(item.id, e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select incharge...</option>
                          {incharges.map(incharge => (
                            <option key={incharge.id} value={incharge.id}>
                              {incharge.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="mt-6 pt-4 border-t grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Ready</p>
                  <p className="text-xl font-bold text-green-600">
                    {readyTotal}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Already Returned</p>
                  <p className="text-xl font-bold text-blue-600">
                    {alreadyReturnedCount}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Errors</p>
                  <p className="text-xl font-bold text-red-600">
                    {errorCount + notIssuedCount}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-xl font-bold">{processedItems.length}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-2">
                <button
                  onClick={submitBulkReceive}
                  disabled={submitting || readyCount === 0}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                    submitting || readyCount === 0
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {submitting ? 'Submitting...' : `Receive ${readyCount} Item(s)`}
                </button>
                <button
                  onClick={clearAll}
                  className="py-2 px-4 rounded-lg font-medium border hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
