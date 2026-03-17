import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { reportsApi, visitsApi } from '../../services/api'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const [visits, setVisits] = useState<any[]>([])
  const [selectedVisit, setSelectedVisit] = useState('')
  const [loading, setLoading] = useState<string>('')

  useEffect(() => { visitsApi.getAll().then(r => setVisits(r.data)) }, [])

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

  return (
    <AdminLayout title="Reports">
      <div className="space-y-6">
        <div className="card">
          <label className="label">Visit Filter (for visit-specific reports)</label>
          <select value={selectedVisit} onChange={e => setSelectedVisit(e.target.value)} className="input w-80">
            <option value="">All Visits</option>
            {visits.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>

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
