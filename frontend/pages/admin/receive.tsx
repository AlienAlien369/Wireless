import { useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import SearchDropdown from '../../components/SearchDropdown'
import BulkEntryModal from '../../components/BulkEntryModal'
import { visitsApi, issuesApi } from '../../services/api'
import { Package, Plus, Search } from 'lucide-react'

export default function ReceivePage() {
  const [visits, setVisits] = useState<any[]>([])
  const [selectedVisit, setSelectedVisit] = useState('')
  const [issues, setIssues] = useState<any[]>([])
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null)
  const [returning, setReturning] = useState<{[key: number]: boolean}>({})
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [allUnreturnedItems, setAllUnreturnedItems] = useState<any[]>([])
  // 🔍 NEW: Search filter state
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    visitsApi.getAll().then(r => setVisits(r.data.filter((v: any) => v.isActive)))
  }, [])

  useEffect(() => {
    if (!selectedVisit) {
      setIssues([])
      setAllUnreturnedItems([])
      setSearchQuery('') // Reset search when visit changes
      return
    }
    issuesApi.getByVisit(parseInt(selectedVisit)).then(r => {
      setIssues(r.data)
      const unreturned = r.data.flatMap((issue: any) => 
        issue.items.filter((i: any) => !i.isReturned).map((item: any) => ({
          ...item,
          issueId: issue.id,
          inchargeName: issue.inchargeName // Include for easier access
        }))
      )
      setAllUnreturnedItems(unreturned)
      setSearchQuery('') // Reset search when data loads
    })
  }, [selectedVisit])

  // 🔍 NEW: Filtered issues based on search
  const filteredIssues = useMemo(() => {
    if (!searchQuery.trim()) return issues
    
    const query = searchQuery.toLowerCase()
    
    return issues.filter(issue => {
      // Search by incharge name
      const nameMatch = issue.inchargeName?.toLowerCase().includes(query)
      // Search by badge number
      const badgeMatch = issue.inchargeBadge?.toLowerCase().includes(query)
      // Search by any item number in the issue
      const itemMatch = issue.items?.some((item: any) => 
        item.itemNumber?.toLowerCase().includes(query) ||
        item.itemType?.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query)
      )
      // Search by group name (if group issue)
      const groupMatch = issue.groupName?.toLowerCase().includes(query)
      
      return nameMatch || badgeMatch || itemMatch || groupMatch
    })
  }, [issues, searchQuery])

  const returnItems = async (issueId: number, itemIds: number[]) => {
    setReturning(p => ({ ...p, [issueId]: true }))
    try {
      await issuesApi.return(issueId, itemIds)
      toast.success('Items marked as returned')
      issuesApi.getByVisit(parseInt(selectedVisit)).then(r => setIssues(r.data))
    } catch { toast.error('Failed to return') }
    finally { setReturning(p => ({ ...p, [issueId]: false })) }
  }

  const handleBulkReturn = async (items: any[]) => {
    const groupedByIssue: {[key: number]: number[]} = {}
    
    items.forEach(item => {
      if (!groupedByIssue[item.issueId]) {
        groupedByIssue[item.issueId] = []
      }
      groupedByIssue[item.issueId].push(item.id)
    })

    try {
      for (const [issueId, itemIds] of Object.entries(groupedByIssue)) {
        await returnItems(parseInt(issueId), itemIds)
      }
      toast.success(`Returned ${items.length} items`)
      setBulkModalOpen(false)
    } catch (e) {
      toast.error('Failed to return some items')
    }
  }

  const statusBadge = (s: string) => {
    if (s === 'Issued') return <span className="badge-issued">Issued</span>
    if (s === 'Returned') return <span className="badge-returned">Returned</span>
    return <span className="badge-broken">Partial</span>
  }

  return (
    <AdminLayout title="Receive Wireless">
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <label className="label">Select Visit</label>
              <div className="max-w-96">
                <SearchDropdown
                  items={visits}
                  value={selectedVisit}
                  onChange={(val) => setSelectedVisit(val.toString())}
                  getLabel={(v) => v.name}
                  getValue={(v) => v.id}
                  placeholder="Search and select a visit..."
                  className="input"
                />
              </div>
            </div>
            {selectedVisit && allUnreturnedItems.length > 0 && (
              <button
                onClick={() => setBulkModalOpen(true)}
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={16} /> Bulk Receive
              </button>
            )}
          </div>
        </div>

        {/* 🔍 NEW: Search Filter for Issues */}
        {selectedVisit && issues.length > 0 && (
          <div className="card bg-gray-50/50">
            <div className="flex items-center gap-3">
              <Search className="text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by incharge name, badge, item number, or brand..."
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-gray-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  Clear
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-xs text-gray-500">
                Showing {filteredIssues.length} of {issues.length} issues
              </div>
            )}
          </div>
        )}

        {filteredIssues.length > 0 && (
          <div className="space-y-3">
            {filteredIssues.map(issue => (
              <div key={issue.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-800">{issue.inchargeName}</div>
                    <div className="text-sm text-gray-500">Badge: {issue.inchargeBadge} · {issue.inchargeMobile}</div>
                    {issue.isGroupIssue && (
                      <div className="text-xs text-blue-600 mt-1">Group: {issue.groupName} · {issue.groupSetCount} sets</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      Issued: {new Date(issue.issuedAt).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(issue.status)}
                    {issue.status !== 'Returned' && (
                      <button onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                        className="text-sm text-primary hover:underline">
                        {expandedIssue === issue.id ? 'Collapse' : 'Receive Items'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Show matching items highlight when searching */}
                {searchQuery && issue.items?.some((i: any) => 
                  i.itemNumber?.toLowerCase().includes(searchQuery.toLowerCase())
                ) && (
                  <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded inline-block">
                    Matching items found in this issue
                  </div>
                )}

                {expandedIssue === issue.id && issue.status !== 'Returned' && (
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-medium text-gray-600 mb-3">Select items to mark as returned:</p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {issue.items.filter((i: any) => !i.isReturned).map((item: any) => (
                        <label key={item.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
                          // 🔍 Highlight matching items when searching
                          searchQuery && item.itemNumber?.toLowerCase().includes(searchQuery.toLowerCase())
                            ? 'bg-yellow-50 border border-yellow-200' 
                            : 'bg-gray-50'
                        }`}>
                          <input type="checkbox" id={`item-${item.id}`} className="w-4 h-4" />
                          <span className="text-sm font-medium">{item.itemNumber || '(no #)'}</span>
                          <span className="text-xs text-gray-500">{item.itemType} · {item.brand}</span>
                          {searchQuery && item.itemNumber?.toLowerCase().includes(searchQuery.toLowerCase()) && (
                            <span className="text-xs text-yellow-600 font-medium">Match</span>
                          )}
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button
                        onClick={() => {
                          const checked = issue.items
                            .filter((i: any) => !i.isReturned)
                            .filter((i: any) => (document.getElementById(`item-${i.id}`) as HTMLInputElement)?.checked)
                            .map((i: any) => i.id)
                          if (checked.length === 0) { toast.error('Select items to return'); return }
                          returnItems(issue.id, checked)
                        }}
                        disabled={returning[issue.id]}
                        className="btn-primary text-sm disabled:opacity-50">
                        {returning[issue.id] ? 'Processing...' : 'Mark Selected as Returned'}
                      </button>
                      <button
                        onClick={() => {
                          const allIds = issue.items.filter((i: any) => !i.isReturned).map((i: any) => i.id)
                          returnItems(issue.id, allIds)
                        }}
                        disabled={returning[issue.id]}
                        className="btn-secondary text-sm disabled:opacity-50">
                        Return All
                      </button>
                    </div>
                  </div>
                )}

                {issue.photoUrls?.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {issue.photoUrls.map((url: string, i: number) => (
                      <img key={i} src={url} alt="Photo" className="w-16 h-16 object-cover rounded-lg border" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty states */}
        {selectedVisit && issues.length === 0 && (
          <div className="card text-center py-10 text-gray-400">No issues found for this visit.</div>
        )}
        
        {selectedVisit && issues.length > 0 && filteredIssues.length === 0 && (
          <div className="card text-center py-10 text-gray-400">
            No issues match "{searchQuery}". 
            <button onClick={() => setSearchQuery('')} className="text-primary hover:underline ml-1">
              Clear filter
            </button>
          </div>
        )}

        <BulkEntryModal
          isOpen={bulkModalOpen}
          onClose={() => setBulkModalOpen(false)}
          title="Bulk Receive Items"
          placeholder="Paste item numbers to receive, one per line or comma-separated\nExample:\nWK-001\nWK-002\nCH-003"
          items={allUnreturnedItems}
          getItemLabel={(item) => item.itemNumber || '(no #)'}
          onAdd={handleBulkReturn}
          itemType="item"
        />
      </div>
    </AdminLayout>
  )
}