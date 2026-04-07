import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import SearchDropdown from '../../components/SearchDropdown'
import { visitsApi, issuesApi } from '../../services/api'
import { getActiveVisits, getLatestActiveVisit } from '../../utils/visits'
import { Mail, CheckCircle, AlertCircle, Clock, Filter } from 'lucide-react'

interface SmsLog {
  id: number
  mobileNumber: string
  message: string
  status: string
  errorMessage?: string
  sentAt: string
}

interface IssueWithLogs {
  id: number
  inchargeName: string
  inchargeBadge: string
  visitName: string
  issuedAt: string
  status: string
  smsLogs: SmsLog[]
}

export default function NotificationCheckPage() {
  const [visits, setVisits] = useState<any[]>([])
  const [selectedVisit, setSelectedVisit] = useState('')
  const [issues, setIssues] = useState<IssueWithLogs[]>([])
  const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'failed'>('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    visitsApi.getAll().then(r => {
      const activeVisits = getActiveVisits(r.data)
      setVisits(activeVisits)

      const latestVisit = getLatestActiveVisit(r.data)
      if (latestVisit) {
        setSelectedVisit(latestVisit.id.toString())
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedVisit) return
    setLoading(true)
    issuesApi.getByVisit(parseInt(selectedVisit)).then(r => {
      setIssues(r.data || [])
    }).catch(() => {
      toast.error('Failed to load issues')
      setIssues([])
    }).finally(() => {
      setLoading(false)
    })
  }, [selectedVisit])

  const getStatusBadge = (status: string) => {
    if (status === 'Sent') {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-green-600" />
          <span className="badge-available">Sent</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2">
        <AlertCircle size={16} className="text-red-600" />
        <span className="badge-broken">Failed</span>
      </div>
    )
  }

  const filteredIssues = issues.filter(issue => {
    if (filterStatus === 'all') return true
    if (!issue.smsLogs || issue.smsLogs.length === 0) return filterStatus === 'failed'
    return issue.smsLogs.some(log => 
      filterStatus === 'sent' ? log.status === 'Sent' : log.status !== 'Sent'
    )
  })

  const stats = {
    total: issues.length,
    withNotifications: issues.filter(i => i.smsLogs?.length > 0).length,
    sent: issues.flatMap(i => i.smsLogs || []).filter(log => log.status === 'Sent').length,
    failed: issues.flatMap(i => i.smsLogs || []).filter(log => log.status !== 'Sent').length,
  }

  return (
    <AdminLayout title="Notification Verification">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="text-3xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Issues</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-blue-600">{stats.withNotifications}</div>
            <div className="text-sm text-gray-600">With Notifications</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-green-600">{stats.sent}</div>
            <div className="text-sm text-gray-600">Sent</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="flex-1 min-w-64">
              <label className="label">Select Visit</label>
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
            <div>
              <label className="label">Filter by Status</label>
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value as 'all' | 'sent' | 'failed')}
                className="input"
              >
                <option value="all">All</option>
                <option value="sent">Sent Only</option>
                <option value="failed">Failed Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Issues List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
          </div>
        ) : selectedVisit ? (
          <div className="space-y-4">
            {filteredIssues.length === 0 ? (
              <div className="card text-center py-10 text-gray-400">
                No issues found for the selected filters.
              </div>
            ) : (
              filteredIssues.map((issue) => (
                <div key={issue.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">{issue.inchargeName}</h3>
                      <p className="text-sm text-gray-500">Badge: {issue.inchargeBadge}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Visit: {issue.visitName} · Issued: {new Date(issue.issuedAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      {issue.smsLogs && issue.smsLogs.length > 0 ? (
                        <div>
                          <div className="font-medium text-gray-700">{issue.smsLogs.length} Notification(s)</div>
                          {getStatusBadge(issue.smsLogs[0].status)}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-orange-600">
                          <Clock size={16} />
                          <span className="text-sm font-medium">No SMS Log</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {issue.smsLogs && issue.smsLogs.length > 0 && (
                    <div className="border-t pt-4">
                      <div className="space-y-3">
                        {issue.smsLogs.map((log, idx) => (
                          <div key={idx} className={`p-3 rounded-lg border ${
                            log.status === 'Sent' 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-red-50 border-red-200'
                          }`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {log.status === 'Sent' ? (
                                  <CheckCircle size={16} className="text-green-600" />
                                ) : (
                                  <AlertCircle size={16} className="text-red-600" />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{log.mobileNumber}</p>
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    {new Date(log.sentAt).toLocaleString('en-IN')}
                                  </p>
                                </div>
                              </div>
                              {getStatusBadge(log.status)}
                            </div>
                            {log.status === 'Sent' ? (
                              <p className="text-xs text-gray-600">{log.message}</p>
                            ) : (
                              <div>
                                <p className="text-xs text-red-700 font-medium">Error: {log.errorMessage}</p>
                                <p className="text-xs text-gray-600 mt-1">{log.message}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="card text-center py-12 text-gray-400">
            <Mail size={32} className="mx-auto mb-4 opacity-50" />
            <p>Select a visit to view notification logs</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
