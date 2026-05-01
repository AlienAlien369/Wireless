import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { issuesApi, visitsApi } from '../../services/api'
import { getActiveVisits, getLatestActiveVisit } from '../../utils/visits'

/**
 * A flat asset item enriched with its parent issue ID so we can call
 * issuesApi.return(issueId, itemIds) correctly even when items from
 * multiple issues are merged into one sewadaar block.
 */
interface FlatItem {
  id: number
  issueId: number
  itemNumber: string
  itemType: string
  assetTypeName?: string
}

/**
 * One entry in the grouped list — all active asset items for a single
 * sewadaar (incharge), possibly spanning multiple issue records.
 */
interface SewadarGroup {
  key: string          // inchargeId or inchargeName used as React key
  inchargeName: string
  visitName: string
  badgeNumber?: string
  items: FlatItem[]
}

export default function ReceiveAssetsPage() {
  const [visitId, setVisitId]   = useState<string>('')
  const [visits, setVisits]     = useState<any[]>([])
  const [issues, setIssues]     = useState<any[]>([])
  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const [search, setSearch]     = useState('')

  useEffect(() => {
    visitsApi.getAll().then((res) => {
      const active = getActiveVisits(res.data)
      setVisits(active)
      const latest = getLatestActiveVisit(res.data)
      if (latest) setVisitId(String(latest.id))
    }).catch(() => toast.error('Failed to load visits'))
  }, [])

  useEffect(() => {
    if (!visitId) { setIssues([]); return }
    issuesApi.getByVisit(Number(visitId)).then((res) => {
      const list = (res.data || []).filter((x: any) => x.status !== 'Returned')
      setIssues(list)
      setSelected({})
    }).catch(() => toast.error('Failed to load issued assets'))
  }, [visitId])

  /** Group raw issue records by sewadaar (inchargeId or inchargeName). */
  const grouped: SewadarGroup[] = (() => {
    const map = new Map<string, SewadarGroup>()
    for (const issue of issues) {
      const key = String(issue.inchargeId ?? issue.inchargeName ?? 'unknown')
      if (!map.has(key)) {
        map.set(key, {
          key,
          inchargeName: issue.inchargeName || '—',
          visitName:    issue.visitName    || '',
          badgeNumber:  issue.badgeNumber,
          items: [],
        })
      }
      const group = map.get(key)!
      const assetItems = (issue.items || []).filter((x: any) => x.assetId && !x.isReturned)
      for (const it of assetItems) {
        group.items.push({
          id:            it.id,
          issueId:       issue.id,
          itemNumber:    it.itemNumber || '',
          itemType:      it.itemType   || '',
          assetTypeName: it.assetTypeName,
        })
      }
    }
    // Drop sewadaars whose items were all returned
    return Array.from(map.values()).filter(g => g.items.length > 0)
  })()

  const toggle = (itemId: number) =>
    setSelected(p => ({ ...p, [itemId]: !p[itemId] }))

  const toggleAll = (group: SewadarGroup) => {
    const allChecked = group.items.every(it => selected[it.id])
    setSelected(p => {
      const next = { ...p }
      group.items.forEach(it => { next[it.id] = !allChecked })
      return next
    })
  }

  /**
   * Return the provided flat items, grouped by their issueId so we make
   * one API call per issue record (backend expects items from the same issue).
   */
  const returnItems = async (items: FlatItem[]) => {
    if (items.length === 0) { toast.error('Select at least one asset item'); return }

    // Bucket items by their parent issue ID
    const byIssue = new Map<number, number[]>()
    for (const it of items) {
      if (!byIssue.has(it.issueId)) byIssue.set(it.issueId, [])
      byIssue.get(it.issueId)!.push(it.id)
    }

    try {
      await Promise.all(
        Array.from(byIssue.entries()).map(([issueId, ids]) =>
          issuesApi.return(issueId, ids)
        )
      )
      toast.success('Assets received')
      const refreshed = await issuesApi.getByVisit(Number(visitId))
      setIssues((refreshed.data || []).filter((x: any) => x.status !== 'Returned'))
      setSelected({})
    } catch {
      toast.error('Failed to receive assets')
    }
  }

  const receiveSelected = (group: SewadarGroup) =>
    returnItems(group.items.filter(it => selected[it.id]))

  const receiveAll = (group: SewadarGroup) =>
    returnItems(group.items)

  // Filter groups by search query
  const visible = grouped.filter(g => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      g.inchargeName.toLowerCase().includes(q) ||
      g.items.some(it =>
        it.itemNumber.toLowerCase().includes(q) ||
        it.itemType.toLowerCase().includes(q)
      )
    )
  })

  return (
    <AdminLayout title="Receive Assets">
      <div className="space-y-4">
        {/* Filters */}
        <div className="card space-y-3">
          <div>
            <label className="label">Visit</label>
            <select className="input max-w-md" value={visitId} onChange={(e) => setVisitId(e.target.value)}>
              <option value="">Select visit...</option>
              {visits.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          {visitId && (
            <input
              className="input max-w-md"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by sewadaar name or item number…"
            />
          )}
        </div>

        {/* Sewadaar blocks */}
        {visible.length === 0 ? (
          <div className="card text-sm text-gray-500">No active issued assets for selected visit.</div>
        ) : (
          <div className="space-y-3">
            {visible.map(group => {
              const allChecked = group.items.length > 0 && group.items.every(it => selected[it.id])
              const anyChecked = group.items.some(it => selected[it.id])
              return (
                <div key={group.key} className="card space-y-3">
                  {/* Sewadaar header */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-semibold text-gray-800 text-base">{group.inchargeName}</div>
                      {group.badgeNumber && (
                        <div className="text-xs text-gray-400">Badge: {group.badgeNumber}</div>
                      )}
                      <div className="text-xs text-gray-500">{group.visitName}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{group.items.length} asset{group.items.length !== 1 ? 's' : ''} issued</div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        className="btn btn-primary text-sm px-3 py-1.5"
                        disabled={!anyChecked}
                        onClick={() => receiveSelected(group)}
                      >
                        Receive Selected
                      </button>
                      <button
                        className="btn btn-secondary text-sm px-3 py-1.5"
                        onClick={() => receiveAll(group)}
                      >
                        Return All
                      </button>
                    </div>
                  </div>

                  {/* Select-all toggle */}
                  <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={() => toggleAll(group)}
                    />
                    Select all
                  </label>

                  {/* Item checkboxes */}
                  <div className="space-y-2">
                    {group.items.map(it => (
                      <label key={it.id} className="flex items-center gap-2 text-sm border rounded-lg p-2 cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={!!selected[it.id]}
                          onChange={() => toggle(it.id)}
                        />
                        <span className="font-medium">{it.itemNumber || '(unnumbered)'}</span>
                        <span className="text-gray-500">{it.itemType}</span>
                        {it.assetTypeName && it.assetTypeName !== it.itemType && (
                          <span className="ml-auto text-xs text-gray-400">{it.assetTypeName}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
