import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  LayoutDashboard, Radio, Users, MapPin, Package,
  ArrowDownToLine, ArrowUpFromLine, AlertTriangle,
  FileBarChart, LogOut, Menu, X, Wifi
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/visits', label: 'Visits', icon: MapPin },
  { href: '/admin/inventory', label: 'Inventory', icon: Package },
  { href: '/admin/incharges', label: 'Incharges', icon: Users },
  { href: '/admin/issue', label: 'Issue Wireless', icon: ArrowDownToLine },
  { href: '/admin/receive', label: 'Receive Wireless', icon: ArrowUpFromLine },
  { href: '/admin/breakage', label: 'Breakage', icon: AlertTriangle },
  { href: '/admin/reports', label: 'Reports', icon: FileBarChart },
]

interface Props {
  children: React.ReactNode
  title?: string
}

export default function AdminLayout({ children, title = 'Dashboard' }: Props) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    if (u.role !== 'Admin') { router.push('/incharge'); return }
    setUser(u)
  }, [])

  const logout = () => {
    localStorage.clear()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-primary-light">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
            <Wifi size={22} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">RSSB Wireless</div>
            <div className="text-gray-400 text-xs">Management System</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = router.pathname === href || (href !== '/admin' && router.pathname.startsWith(href))
            return (
              <Link key={href} href={href}
                className={`sidebar-link ${active ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}>
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-light">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-sm font-medium">{user?.fullName}</div>
              <div className="text-gray-400 text-xs">Administrator</div>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-white transition-colors" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
          <button className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
          <div className="ml-auto">
            <span className="text-sm text-gray-500">
              Bhatti Center · Wireless Management
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
