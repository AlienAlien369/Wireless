import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { issuesApi, visitsApi } from '../../services/api'
import { getActiveVisits, getLatestActiveVisit } from '../../utils/visits'

export default function ReceiveAssetsPage() {
  const [visitId, setVisitId] = useState<string>('')
  const [visits, setVisits] = useState<any[]>([])
  const [issues, setIssues] = useState<any[]>([])
  const [selected, setSelected] = useState<Record<number, boolean>>({})

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

  const toggle = (itemId: number) => setSelected((p) => ({ ...p, [itemId]: !p[itemId] }))

  const receive = async (issue: any) => {
    const itemIds = (issue.items || []).filter((x: any) => x.assetId && !x.isReturned && selected[x.id]).map((x: any) => x.id)
    if (itemIds.length === 0) { toast.error('Select at least one asset item'); return }
    try {
      await issuesApi.return(issue.id, itemIds)
      toast.success('Assets received')
      const refreshed = await issuesApi.getByVisit(Number(visitId))
      setIssues((refreshed.data || []).filter((x: any) => x.status !== 'Returned'))
      setSelected({})
    } catch {
      toast.error('Failed to receive assets')
    }
  }

  return (
    <AdminLayout title="Receive Assets">
      <div className="space-y-4">
        <div className="card">
          <label className="label">Visit</label>
          <select className="input max-w-md" value={visitId} onChange={(e) => setVisitId(e.target.value)}>
            <option value="">Select visit...</option>
            {visits.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>

        {issues.length === 0 ? (
          <div className="card text-sm text-gray-500">No active issued assets for selected visit.</div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue: any) => {
              const assetItems = (issue.items || []).filter((x: any) => x.assetId && !x.isReturned)
              if (assetItems.length === 0) return null
              return (
                <div key={issue.id} className="card space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">{issue.inchargeName}</div>
                      <div className="text-xs text-gray-500">Sewadaar</div>
                      <div className="text-xs text-gray-500">{issue.visitName}</div>
                    </div>
                    <button className="btn-primary" onClick={() => receive(issue)}>Receive Selected</button>
                  </div>
                  <div className="space-y-2">
                    {assetItems.map((it: any) => (
                      <label key={it.id} className="flex items-center gap-2 text-sm border rounded-lg p-2">
                        <input type="checkbox" checked={!!selected[it.id]} onChange={() => toggle(it.id)} />
                        <span className="font-medium">{it.itemNumber || '(unnumbered)'}</span>
                        <span className="text-gray-500">{it.itemType}</span>
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
