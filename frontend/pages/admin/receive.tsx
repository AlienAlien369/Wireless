import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { visitsApi, issuesApi } from '../../services/api'

export default function ReceivePage() {
  const [visits, setVisits] = useState<any[]>([])
  const [selectedVisit, setSelectedVisit] = useState('')
  const [issues, setIssues] = useState<any[]>([])
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null)
  const [returning, setReturning] = useState<{[key: number]: boolean}>({})

  useEffect(() => {
    visitsApi.getAll().then(r => setVisits(r.data.filter((v: any) => v.isActive)))
  }, [])

  useEffect(() => {
    if (!selectedVisit) return
    issuesApi.getByVisit(parseInt(selectedVisit)).then(r => setIssues(r.data))
  }, [selectedVisit])

  const returnItems = async (issueId: number, itemIds: number[]) => {
    setReturning(p => ({ ...p, [issueId]: true }))
    try {
      await issuesApi.return(issueId, itemIds)
      toast.success('Items marked as returned')
      issuesApi.getByVisit(parseInt(selectedVisit)).then(r => setIssues(r.data))
    } catch { toast.error('Failed to return') }
    finally { setReturning(p => ({ ...p, [issueId]: false })) }
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
          <label className="label">Select Visit</label>
          <select value={selectedVisit} onChange={e => setSelectedVisit(e.target.value)} className="input w-80">
            <option value="">— Select a Visit —</option>
            {visits.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>

        {issues.length > 0 && (
          <div className="space-y-3">
            {issues.map(issue => (
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

                {expandedIssue === issue.id && issue.status !== 'Returned' && (
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-medium text-gray-600 mb-3">Select items to mark as returned:</p>
                    <div className="space-y-2">
                      {issue.items.filter((i: any) => !i.isReturned).map((item: any) => (
                        <label key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                          <input type="checkbox" id={`item-${item.id}`} className="w-4 h-4" />
                          <span className="text-sm font-medium">{item.itemNumber || '(no #)'}</span>
                          <span className="text-xs text-gray-500">{item.itemType} · {item.brand}</span>
                        </label>
                      ))}
                    </div>
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
                      className="mt-3 btn-primary text-sm disabled:opacity-50">
                      {returning[issue.id] ? 'Processing...' : 'Mark Selected as Returned'}
                    </button>
                    <button
                      onClick={() => {
                        const allIds = issue.items.filter((i: any) => !i.isReturned).map((i: any) => i.id)
                        returnItems(issue.id, allIds)
                      }}
                      disabled={returning[issue.id]}
                      className="mt-3 ml-2 btn-secondary text-sm disabled:opacity-50">
                      Return All
                    </button>
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

        {selectedVisit && issues.length === 0 && (
          <div className="card text-center py-10 text-gray-400">No issues found for this visit.</div>
        )}
      </div>
    </AdminLayout>
  )
}
