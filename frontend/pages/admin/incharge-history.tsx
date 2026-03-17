import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { inchargesApi, issuesApi } from '../../services/api'

export default function InchargeHistoryPage() {
  const [incharges, setIncharges] = useState<any[]>([])
  const [selected, setSelected] = useState('')
  const [issues, setIssues] = useState<any[]>([])

  useEffect(() => { inchargesApi.getAll().then(r => setIncharges(r.data)) }, [])
  useEffect(() => {
    if (!selected) return
    issuesApi.getByIncharge(parseInt(selected)).then(r => setIssues(r.data))
  }, [selected])

  return (
    <AdminLayout title="Incharge History">
      <div className="space-y-4">
        <div className="card">
          <label className="label">Select Incharge</label>
          <select value={selected} onChange={e => setSelected(e.target.value)} className="input w-80">
            <option value="">— Select —</option>
            {incharges.map(i => <option key={i.id} value={i.id}>{i.name} ({i.badgeNumber})</option>)}
          </select>
        </div>

        {issues.length > 0 && (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Visit', 'Items', 'Status', 'Issued At', 'Returned At'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {issues.map((issue: any) => (
                  <tr key={issue.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{issue.visitName || issue.visit?.name}</td>
                    <td className="px-4 py-3">{issue.isGroupIssue ? `${issue.groupSetCount} sets (group)` : (issue.items?.length || 0)}</td>
                    <td className="px-4 py-3">
                      <span className={issue.status === 'Returned' ? 'badge-returned' : issue.status === 'Issued' ? 'badge-issued' : 'badge-broken'}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(issue.issuedAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{issue.returnedAt ? new Date(issue.returnedAt).toLocaleDateString('en-IN') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
