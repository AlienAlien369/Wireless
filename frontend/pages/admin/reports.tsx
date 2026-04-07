import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { reportsApi, visitsApi, issuesApi } from '../../services/api'
import { Download, FileSpreadsheet, FileText, ChevronDown, ChevronUp, Clock, CheckCircle } from 'lucide-react'
import { getActiveVisits, getLatestActiveVisit } from '../../utils/visits'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function renderIssuedItems(issue: any) {
  if (issue.isGroupIssue) {
    return issue.groupName
      ? `Group: ${issue.groupName} (${issue.groupSetCount || 0} sets)`
      : `Group issue (${issue.groupSetCount || 0} sets)`
  }

  const itemNumbers = (issue.items || [])
    .map((item: any) => item.itemNumber || item.itemType)
    .filter(Boolean)

  return itemNumbers.length > 0 ? itemNumbers.join(', ') : 'No item numbers'
}

export default function ReportsPage() {
  const [visits, setVisits] = useState<any[]>([])
  const [selectedVisit, setSelectedVisit] = useState('')
  const [loading, setLoading] = useState<string>('')
  const [issuedList, setIssuedList] = useState<any[]>([])
  const [returnedList, setReturnedList] = useState<any[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [expandedVisit, setExpandedVisit] = useState<number | null>(null)

useEffect(() => {
  visitsApi.getAll().then(r => {
    const activeVisits = getActiveVisits(r.data)
    setVisits(activeVisits)

    const latestVisit = getLatestActiveVisit(r.data)
    if (latestVisit) {
      const latestVisitId = Number(latestVisit.id)
      setSelectedVisit(latestVisit.id.toString());
      setExpandedVisit(latestVisitId)
      loadVisitDetails(latestVisitId)
    }
  })
}, [])

  const loadVisitDetails = async (visitId: number) => {
    setLoadingList(true)
    try {
      const res = await issuesApi.getByVisit(visitId)
      const issued = res.data || []
      const returned = issued.filter((i: any) => i.status === 'Returned')
      const current = issued.filter((i: any) => i.status !== 'Returned')
      setIssuedList(current)
      setReturnedList(returned)
    } catch (e) {
      toast.error('Failed to load visit details')
    } finally {
      setLoadingList(false)
    }
  }

  const handleVisitSelect = (visitId: string | number) => {
    const id = parseInt(visitId.toString())
    setSelectedVisit(visitId.toString())
    if (expandedVisit === id) {
      setExpandedVisit(null)
    } else {
      setExpandedVisit(id)
      loadVisitDetails(id)
    }
  }

  const download = async (type: string) => {
    setLoading(type)
    try {
      let res: any
      if (type === 'visit-excel') {
        if (!selectedVisit) { toast.error('Select a visit'); setLoading(''); return }
        res = await reportsApi.visitExcel(parseInt(selectedVisit))
        downloadBlob(new Blob([res.data]), `visit_report.xlsx`)
      } else if (type === 'inventory-excel') {
        res = await reportsApi.inventoryExcel()
        downloadBlob(new Blob([res.data]), 'inventory_report.xlsx')
      } else if (type === 'breakages-pdf') {
        res = await reportsApi.breakagesPdf(selectedVisit ? parseInt(selectedVisit) : undefined)
        downloadBlob(new Blob([res.data], { type: 'application/pdf' }), 'breakage_report.pdf')
      }
      toast.success('Report downloaded!')
    } catch { toast.error('Failed to generate report') }
    finally { setLoading('') }
  }


  const ReportCard = ({ title, description, type, icon: Icon, color }: any) => (
    <div className="card">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
          <button onClick={() => download(type)} disabled={loading === type}
            className="mt-3 btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
            <Download size={14} />
            {loading === type ? 'Generating...' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  )

  const statusBadge = (s: string) => {
    if (s === 'Issued') return <span className="badge-issued">Issued</span>
    if (s === 'Returned') return <span className="badge-returned">Returned</span>
    return <span className="badge-broken">Partial</span>
  }

  return (
    <AdminLayout title="Reports">
      <div className="space-y-6">
        <div className="card">
          <label className="label">Visit Filter (for visit-specific reports)</label>
          <div className="w-full md:w-96">
            <select
              value={selectedVisit}
              className="input"
              onChange={(e) => handleVisitSelect(e.target.value)}
            >
              <option value="">Select Visit</option>
              {visits.map((visit) => (
                <option key={visit.id} value={visit.id}>
                  {visit.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedVisit && expandedVisit && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">
              {visits.find(v => v.id === expandedVisit)?.name} - Details
            </h3>

            {loadingList ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Currently Issued */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-yellow-500" /> Currently Issued ({issuedList.length})
                  </h4>
                  
                  {/* Mobile Card View */}
                  <div className="space-y-3 md:hidden">
                    {issuedList.length === 0 ? (
                      <div className="card text-center py-8">
                        <p className="text-gray-500">No current issues</p>
                      </div>
                    ) : (
                      issuedList.map((issue) => (
                        <div key={issue.id} className="card border-l-4 border-yellow-500 p-4">
                          <div className="font-bold text-gray-800">{issue.inchargeName}</div>
                          <div className="text-xs text-gray-500 mt-1">Badge: {issue.inchargeBadge}</div>
                          <div className="space-y-2 mt-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Mobile:</span>
                              <a href={`tel:${issue.inchargeMobile}`} className="text-blue-600">{issue.inchargeMobile}</a>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Items:</span>
                              <span className="font-medium">{issue.items?.length || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Issued Item Numbers:</span>
                              <p className="mt-1 text-xs text-gray-700">{renderIssuedItems(issue)}</p>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Issued:</span>
                              <span>{new Date(issue.issuedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            {statusBadge(issue.status)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block table-responsive">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <tr>
                          {['Sr.', 'Incharge', 'Badge', 'Mobile', 'Items Count', 'Item Numbers', 'Issued At', 'Status'].map(h => (
                            <th key={h} className="text-left px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {issuedList.length === 0 ? (
                          <tr><td colSpan={8} className="text-center py-4 text-gray-500">No current issues</td></tr>
                        ) : (
                          issuedList.map((issue, idx) => (
                            <tr key={issue.id} className="border-b border-gray-100 hover:bg-yellow-50 transition-colors">
                              <td className="px-3 py-2 text-gray-500 font-medium">{idx + 1}</td>
                              <td className="px-3 py-2 font-bold text-gray-800">{issue.inchargeName}</td>
                              <td className="px-3 py-2 text-gray-600">{issue.inchargeBadge}</td>
                              <td className="px-3 py-2"><a href={`tel:${issue.inchargeMobile}`} className="text-blue-600 hover:underline">{issue.inchargeMobile}</a></td>
                              <td className="px-3 py-2 font-medium">{issue.items?.length || 0}</td>
                              <td className="px-3 py-2 text-xs text-gray-600 max-w-sm">{renderIssuedItems(issue)}</td>
                              <td className="px-3 py-2 text-xs text-gray-500">{new Date(issue.issuedAt).toLocaleDateString()}</td>
                              <td className="px-3 py-2">{statusBadge(issue.status)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Returned */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" /> Returned ({returnedList.length})
                  </h4>

                  {/* Mobile Card View */}
                  <div className="space-y-3 md:hidden">
                    {returnedList.length === 0 ? (
                      <div className="card text-center py-8">
                        <p className="text-gray-500">No returned items</p>
                      </div>
                    ) : (
                      returnedList.map((issue) => (
                        <div key={issue.id} className="card border-l-4 border-green-500 p-4">
                          <div className="font-bold text-gray-800">{issue.inchargeName}</div>
                          <div className="text-xs text-gray-500 mt-1">Badge: {issue.inchargeBadge}</div>
                          <div className="space-y-2 mt-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Mobile:</span>
                              <a href={`tel:${issue.inchargeMobile}`} className="text-blue-600">{issue.inchargeMobile}</a>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Items:</span>
                              <span className="font-medium">{issue.items?.length || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Issued Item Numbers:</span>
                              <p className="mt-1 text-xs text-gray-700">{renderIssuedItems(issue)}</p>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Issued:</span>
                              <span>{new Date(issue.issuedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Returned:</span>
                              <span className="text-green-600 font-medium">{new Date(issue.returnedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block table-responsive">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <tr>
                          {['Sr.', 'Incharge', 'Badge', 'Mobile', 'Items Count', 'Item Numbers', 'Issued At', 'Returned At'].map(h => (
                            <th key={h} className="text-left px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {returnedList.length === 0 ? (
                          <tr><td colSpan={8} className="text-center py-4 text-gray-500">No returned items</td></tr>
                        ) : (
                          returnedList.map((issue, idx) => (
                            <tr key={issue.id} className="border-b border-gray-100 hover:bg-green-50 transition-colors">
                              <td className="px-3 py-2 text-gray-500 font-medium">{idx + 1}</td>
                              <td className="px-3 py-2 font-bold text-gray-800">{issue.inchargeName}</td>
                              <td className="px-3 py-2 text-gray-600">{issue.inchargeBadge}</td>
                              <td className="px-3 py-2"><a href={`tel:${issue.inchargeMobile}`} className="text-blue-600 hover:underline">{issue.inchargeMobile}</a></td>
                              <td className="px-3 py-2 font-medium">{issue.items?.length || 0}</td>
                              <td className="px-3 py-2 text-xs text-gray-600 max-w-sm">{renderIssuedItems(issue)}</td>
                              <td className="px-3 py-2 text-xs text-gray-500">{new Date(issue.issuedAt).toLocaleDateString()}</td>
                              <td className="px-3 py-2 text-xs font-medium text-green-600">{new Date(issue.returnedAt).toLocaleDateString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReportCard
            title="Visit Issuance Report (Excel)"
            description="Full list of all wireless sets issued during the selected visit, including incharge details and return status."
            type="visit-excel"
            icon={FileSpreadsheet}
            color="bg-green-500"
          />
          <ReportCard
            title="Inventory Report (Excel)"
            description="Complete inventory list with status — color coded for Available, Issued, and Broken equipment."
            type="inventory-excel"
            icon={FileSpreadsheet}
            color="bg-blue-500"
          />
          <ReportCard
            title="Breakage Report (PDF)"
            description="Detailed PDF of all damaged/broken equipment. Filter by visit for visit-specific breakage report."
            type="breakages-pdf"
            icon={FileText}
            color="bg-red-500"
          />
        </div>
      </div>
    </AdminLayout>
  )
}
