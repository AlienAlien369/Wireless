import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  LayoutDashboard, Radio, Users, MapPin, Package,
  ArrowDownToLine, ArrowUpFromLine, AlertTriangle,
  FileBarChart, LogOut, Menu, X, Wifi
} from 'lucide-react'
import { Shield } from 'lucide-react'
import { Boxes, UserCog } from 'lucide-react'
import { menuApi } from '../../services/api'
import { APP_NAME, DEFAULT_CENTER_NAME, PRODUCT_TAGLINE } from '../../config/app'

interface Props {
  children: React.ReactNode
  title?: string
}

export default function AdminLayout({ children, title = 'Dashboard' }: Props) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [navItems, setNavItems] = useState<any[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    const canUseAdminUi = u.audience === 'Admin' || u.role === 'SUPER_ADMIN' || u.role === 'Admin' || u.role === 'Center Head'
    if (!canUseAdminUi) { router.push('/incharge'); return }
    setUser(u)

    const iconMap: Record<string, any> = {
      LayoutDashboard,
      MapPin,
      Package,
      Users,
      ArrowDownToLine,
      ArrowUpFromLine,
      AlertTriangle,
      FileBarChart,
      Shield,
      Boxes,
      UserCog,
      Radio,
      Wifi,
    }

    menuApi.getMy()
      .then((r) => {
        const items = (r.data || []).map((x: any) => ({
          href: x.path,
          label: x.label,
          icon: iconMap[x.icon] || LayoutDashboard,
        }))
        const resolvedItems = items
        setNavItems(resolvedItems)

        // Route-level RBAC: redirect to first allowed admin page when a URL is not assigned.
        const isAllowed = resolvedItems.some((i: any) => router.pathname === i.href || (i.href !== '/admin' && router.pathname.startsWith(i.href)))
        if (!isAllowed && resolvedItems.length > 0) router.replace(resolvedItems[0].href)
      })
      .catch(() => setNavItems([]))
  }, [router])

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
            <div className="text-white font-bold text-sm leading-tight">{APP_NAME}</div>
            <div className="text-gray-400 text-xs">{PRODUCT_TAGLINE}</div>
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
              <div className="text-gray-400 text-xs">{user?.role || 'User'}</div>
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
              {(user?.centerName || DEFAULT_CENTER_NAME)} · {APP_NAME}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
