import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { reportsApi } from '../../services/api'
import { Radio, Users, AlertTriangle, CheckCircle, Clock, MapPin, Calendar, Activity, TrendingUp, Send } from 'lucide-react'

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

interface VisitStat {
  visitId: number
  visitName: string
  totalCurrentlyIssued: number
  kenwoodSetsCurrentlyIssued: number
  kenwoodSetsRemaining: number
  vertelSetsCurrentlyIssued: number
  vertelSetsRemaining: number
  asperaSetsCurrentlyIssued: number
  asperaSetsRemaining: number
  kenwoodChargersCurrentlyIssued: number
  kenwoodChargersRemaining: number
  vertelChargersCurrentlyIssued: number
  vertelChargersRemaining: number
  asperaChargersCurrentlyIssued: number
  asperaChargersRemaining: number
  kitsCurrentlyIssued: number
  kitsRemaining: number
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

function CountPair({
  issued,
  remaining,
}: {
  issued: number
  remaining: number
}) {
  return (
    <div className="space-y-1 min-w-32">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-gray-500">Issued</span>
        <span className="font-semibold text-gray-800">{issued}</span>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-gray-500">Remaining</span>
        <span className="font-semibold text-gray-800">{remaining}</span>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [visitStats, setVisitStats] = useState<VisitStat[]>([])

  useEffect(() => {
    reportsApi.getDashboard().then(r => setStats(r.data)).catch(console.error)
    reportsApi.getVisitWiseDashboard().then(r => setVisitStats(r.data)).catch(console.error)
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

        {/* Visit-wise Breakdown */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} /> Visit-wise Issue Summary
          </h3>

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {visitStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No visit data available</div>
            ) : (
              visitStats.map((visit) => (
                <div key={visit.visitName} className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="font-bold text-gray-800">{visit.visitName}</div>
                    <div className="bg-slate-800 text-white px-3 py-2 rounded-lg font-bold text-center">
                      {visit.totalCurrentlyIssued}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mb-3">Total currently issued</div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-gray-700 mb-1">Sets</div>
                      <div className="space-y-2 text-xs">
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                          <div className="font-semibold text-blue-700 mb-2">Kenwood Sets</div>
                          <CountPair issued={visit.kenwoodSetsCurrentlyIssued} remaining={visit.kenwoodSetsRemaining} />
                        </div>
                        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                          <div className="font-semibold text-green-700 mb-2">Vertel Sets</div>
                          <CountPair issued={visit.vertelSetsCurrentlyIssued} remaining={visit.vertelSetsRemaining} />
                        </div>
                        <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                          <div className="font-semibold text-purple-700 mb-2">Aspera Sets</div>
                          <CountPair issued={visit.asperaSetsCurrentlyIssued} remaining={visit.asperaSetsRemaining} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-700 mb-1">Chargers</div>
                      <div className="space-y-2 text-xs">
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                          <div className="font-semibold text-blue-700 mb-2">Kenwood Chargers</div>
                          <CountPair issued={visit.kenwoodChargersCurrentlyIssued} remaining={visit.kenwoodChargersRemaining} />
                        </div>
                        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                          <div className="font-semibold text-green-700 mb-2">Vertel Chargers</div>
                          <CountPair issued={visit.vertelChargersCurrentlyIssued} remaining={visit.vertelChargersRemaining} />
                        </div>
                        <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                          <div className="font-semibold text-purple-700 mb-2">Aspera Chargers</div>
                          <CountPair issued={visit.asperaChargersCurrentlyIssued} remaining={visit.asperaChargersRemaining} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-700 mb-1">Kits</div>
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                        <div className="font-semibold text-red-700 mb-2">Kits</div>
                        <CountPair issued={visit.kitsCurrentlyIssued} remaining={visit.kitsRemaining} />
                      </div>
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
                  {[
                    'Visit Name',
                    'Total Currently Issued',
                    'Kenwood Sets',
                    'Vertel Sets',
                    'Aspera Sets',
                    'Kenwood Chargers',
                    'Vertel Chargers',
                    'Aspera Chargers',
                    'Kits',
                  ].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visitStats.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-4 text-gray-500">No visit data available</td></tr>
                ) : (
                  visitStats.map((visit, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-800">{visit.visitName}</td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                          {visit.totalCurrentlyIssued}
                        </span>
                      </td>
                      <td className="px-4 py-3"><CountPair issued={visit.kenwoodSetsCurrentlyIssued} remaining={visit.kenwoodSetsRemaining} /></td>
                      <td className="px-4 py-3"><CountPair issued={visit.vertelSetsCurrentlyIssued} remaining={visit.vertelSetsRemaining} /></td>
                      <td className="px-4 py-3"><CountPair issued={visit.asperaSetsCurrentlyIssued} remaining={visit.asperaSetsRemaining} /></td>
                      <td className="px-4 py-3"><CountPair issued={visit.kenwoodChargersCurrentlyIssued} remaining={visit.kenwoodChargersRemaining} /></td>
                      <td className="px-4 py-3"><CountPair issued={visit.vertelChargersCurrentlyIssued} remaining={visit.vertelChargersRemaining} /></td>
                      <td className="px-4 py-3"><CountPair issued={visit.asperaChargersCurrentlyIssued} remaining={visit.asperaChargersRemaining} /></td>
                      <td className="px-4 py-3"><CountPair issued={visit.kitsCurrentlyIssued} remaining={visit.kitsRemaining} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
