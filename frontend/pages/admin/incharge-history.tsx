import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { inchargesApi, issuesApi } from '../../services/api'
import { Calendar, Package } from 'lucide-react'

export default function InchargeHistoryPage() {
  const [incharges, setIncharges] = useState<any[]>([])
  const [selected, setSelected] = useState('')
  const [issues, setIssues] = useState<any[]>([])

  useEffect(() => { inchargesApi.getAll().then(r => setIncharges(r.data)) }, [])
  useEffect(() => {
    if (!selected) return
    issuesApi.getByIncharge(parseInt(selected)).then(r => setIssues(r.data))
  }, [selected])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Returned': return 'border-green-500'
      case 'Issued': return 'border-yellow-500'
      default: return 'border-red-500'
    }
  }

  const selectedIncharge = incharges.find(i => i.id === parseInt(selected))

  return (
    <AdminLayout title="Incharge History">
      <div className="space-y-4">
        <div className="card">
          <label className="label">Select Incharge</label>
          <select value={selected} onChange={e => setSelected(e.target.value)} className="input w-full md:w-80">
            <option value="">— Select —</option>
            {incharges.map(i => <option key={i.id} value={i.id}>{i.name} ({i.badgeNumber})</option>)}
          </select>
        </div>

        {issues.length > 0 && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="card">
                <div className="text-2xl md:text-3xl font-bold text-primary">{issues.length}</div>
                <div className="text-xs md:text-sm text-gray-600">Total Issues</div>
              </div>
              <div className="card">
                <div className="text-2xl md:text-3xl font-bold text-green-600">{issues.filter((i: any) => i.status === 'Returned').length}</div>
                <div className="text-xs md:text-sm text-gray-600">Returned</div>
              </div>
              <div className="card">
                <div className="text-2xl md:text-3xl font-bold text-yellow-600">{issues.filter((i: any) => i.status === 'Issued').length}</div>
                <div className="text-xs md:text-sm text-gray-600">Outstanding</div>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-3 md:hidden">
              {issues.map((issue: any) => (
                <div key={issue.id} className={`card border-l-4 p-4 ${getStatusColor(issue.status)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-bold text-gray-800 text-sm">{issue.visitName || issue.visit?.name}</div>
                    <span className={issue.status === 'Returned' ? 'badge-returned' : issue.status === 'Issued' ? 'badge-issued' : 'badge-broken'}>
                      {issue.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-gray-600">
                      <span className="flex items-center gap-1"><Package size={12} /> Items:</span>
                      <span className="font-medium">{issue.isGroupIssue ? `${issue.groupSetCount} sets (group)` : (issue.items?.length || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600">
                      <span className="flex items-center gap-1"><Calendar size={12} /> Issued:</span>
                      <span>{new Date(issue.issuedAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    {issue.returnedAt && (
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1"><Calendar size={12} /> Returned:</span>
                        <span className="text-green-600 font-medium">{new Date(issue.returnedAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block card p-0 overflow-hidden">
              <div className="table-responsive">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      {['Visit', 'Items', 'Status', 'Issued At', 'Returned At'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-gray-700">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue: any) => (
                      <tr key={issue.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-800">{issue.visitName || issue.visit?.name}</td>
                        <td className="px-4 py-3 font-medium">{issue.isGroupIssue ? `${issue.groupSetCount} sets (group)` : (issue.items?.length || 0)}</td>
                        <td className="px-4 py-3">
                          <span className={issue.status === 'Returned' ? 'badge-returned' : issue.status === 'Issued' ? 'badge-issued' : 'badge-broken'}>
                            {issue.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{new Date(issue.issuedAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3 text-gray-600 font-medium">{issue.returnedAt ? <span className="text-green-600">{new Date(issue.returnedAt).toLocaleDateString('en-IN')}</span> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!selected && (
          <div className="card text-center py-12 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p>Select an incharge to view their issue history</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
