import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { issuesApi } from '../../services/api'
import { Radio, Package, Headphones, LogOut, Wifi, ChevronDown, ChevronUp } from 'lucide-react'

export default function InchargeDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [issues, setIssues] = useState<any[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    if (u.role === 'Admin') { router.push('/admin'); return }
    setUser(u)
    // Load issues by incharge
    issuesApi.getByIncharge(u.inchargeId || 0).then(r => setIssues(r.data)).catch(console.error)
  }, [])

  const logout = () => { localStorage.clear(); router.push('/login') }

  const statusBadge = (s: string) => {
    if (s === 'Issued') return <span className="badge-issued">Issued</span>
    if (s === 'Returned') return <span className="badge-returned">Returned</span>
    return <span className="badge-broken">Partial</span>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary text-white px-5 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
              <Wifi size={18} className="text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm">RSSB Wireless</div>
              <div className="text-blue-200 text-xs">{user?.fullName}</div>
            </div>
          </div>
          <button onClick={logout} className="text-blue-200 hover:text-white">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {issues.length === 0 ? (
          <div className="card text-center py-10">
            <Radio size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No issued equipment found for your account.</p>
          </div>
        ) : (
          issues.map(issue => (
            <div key={issue.id} className="card">
              <div className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpanded(expanded === issue.id ? null : issue.id)}>
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{issue.visitName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(issue.issuedAt).toLocaleDateString('en-IN')}
                  </div>
                  {issue.isGroupIssue && (
                    <div className="text-xs text-blue-600 mt-1">{issue.groupName} · {issue.groupSetCount} sets</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(issue.status)}
                  {expanded === issue.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {expanded === issue.id && (
                <div className="mt-4 border-t pt-4 space-y-2">
                  {issue.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      {item.itemType === 'WirelessSet' ? <Radio size={16} className="text-primary" />
                        : item.itemType === 'Charger' ? <Package size={16} className="text-yellow-500" />
                        : <Headphones size={16} className="text-purple-500" />}
                      <div>
                        <div className="text-sm font-medium">{item.itemNumber || '(no number)'}</div>
                        <div className="text-xs text-gray-400">{item.itemType} · {item.brand || 'Kit'}</div>
                      </div>
                      <div className="ml-auto">
                        {item.isReturned
                          ? <span className="badge-returned text-xs">Returned</span>
                          : <span className="badge-issued text-xs">Active</span>}
                      </div>
                    </div>
                  ))}
                  {issue.remarks && (
                    <p className="text-xs text-gray-500 bg-yellow-50 rounded p-2">Remarks: {issue.remarks}</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  )
}
