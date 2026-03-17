import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { reportsApi } from '../../services/api'
import { Radio, Users, AlertTriangle, CheckCircle, Clock, MapPin, Calendar, Activity } from 'lucide-react'

interface Stats {
  totalWirelessSets: number
  availableSets: number
  issuedSets: number
  brokenSets: number
  totalIncharges: number
  activeVisits: number
  todayIssues: number
  totalBreakages: number
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    reportsApi.getDashboard().then(r => setStats(r.data)).catch(console.error)
  }, [])

  if (!stats) return (
    <AdminLayout title="Dashboard">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary to-primary-light rounded-xl p-6 text-white">
          <h2 className="text-xl font-bold mb-1">RSSB Bhatti Center</h2>
          <p className="text-blue-100 text-sm">Wireless Equipment Management · Visit Season Dashboard</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Sets" value={stats.totalWirelessSets} icon={Radio} color="bg-primary" />
          <StatCard label="Available" value={stats.availableSets} icon={CheckCircle} color="bg-green-500" />
          <StatCard label="Issued" value={stats.issuedSets} icon={Clock} color="bg-yellow-500" />
          <StatCard label="Broken" value={stats.brokenSets} icon={AlertTriangle} color="bg-red-500" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Incharges" value={stats.totalIncharges} icon={Users} color="bg-purple-500" />
          <StatCard label="Active Visits" value={stats.activeVisits} icon={MapPin} color="bg-indigo-500" />
          <StatCard label="Today Issues" value={stats.todayIssues} icon={Calendar} color="bg-teal-500" />
          <StatCard label="Total Breakages" value={stats.totalBreakages} icon={Activity} color="bg-orange-500" />
        </div>

        {/* Wireless brand summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Kenwood', 'Vertel', 'Aspera'].map(brand => (
            <div key={brand} className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">{brand}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  brand === 'Kenwood' ? 'bg-blue-100 text-blue-700' :
                  brand === 'Vertel' ? 'bg-green-100 text-green-700' :
                  'bg-purple-100 text-purple-700'}`}>
                  {brand === 'Kenwood' ? 'QR + Kits' : brand === 'Vertel' ? 'Group Issue' : 'No Charger#'}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {brand === 'Kenwood' && 'Individual tracking, QR codes, earphone kits available'}
                {brand === 'Vertel' && 'Group-wise issuance with numbered chargers'}
                {brand === 'Aspera' && 'Group-wise issuance, chargers without numbers'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
