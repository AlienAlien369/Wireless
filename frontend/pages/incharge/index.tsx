import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { LogOut, ShieldAlert, Wifi } from 'lucide-react'
import { APP_NAME } from '../../config/app'

export default function InchargeDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    if (u.audience === 'Admin' || u.role === 'SUPER_ADMIN' || u.role === 'Admin' || u.role === 'Center Head') { router.push('/admin'); return }
    setUser(u)
  }, [])

  const logout = () => { localStorage.clear(); router.push('/login') }

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
              <div className="font-semibold text-sm">{APP_NAME}</div>
              <div className="text-blue-200 text-xs">{user?.fullName}</div>
            </div>
          </div>
          <button onClick={logout} className="text-blue-200 hover:text-white">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        <div className="card text-center py-10">
          <ShieldAlert size={40} className="text-amber-500 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">Sewadaar access is restricted.</p>
          <p className="text-sm text-gray-500 mt-1">Please contact your Center Head or SUPER_ADMIN for access changes.</p>
        </div>
      </main>
    </div>
  )
}
