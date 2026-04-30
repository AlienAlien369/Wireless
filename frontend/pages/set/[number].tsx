import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { inventoryApi, assetsApi } from '../../services/api'
import { Radio, User, Hash, Phone, MapPin, CheckCircle, AlertCircle, Package } from 'lucide-react'

export default function SetLookupPage() {
  const router = useRouter()
  const { number } = router.query
  const [data, setData] = useState<any>(null)
  const [assetData, setAssetData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const defaultContactNumber = '8800191819'

  useEffect(() => {
    if (!number) return
    const num = number as string

    if (num.toUpperCase().startsWith('AST-')) {
      // If the user is already logged in, send them straight to the issue page
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (token) {
        router.replace(`/admin/issue-assets?qr=${encodeURIComponent(num)}`)
        return
      }
      // Not logged in — show public status page
      assetsApi.scanQrPublic(num)
        .then(r => setAssetData(r.data))
        .catch(() => setError(true))
        .finally(() => setLoading(false))
    } else {
      // Legacy wireless set QR — public endpoint, no auth required
      inventoryApi.getSetByNumberPublic(num)
        .then(r => setData(r.data))
        .catch(() => setError(true))
        .finally(() => setLoading(false))
    }
  }, [number])

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark to-primary flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-700">Not Found</h1>
        <p className="text-gray-500 mt-1">The item <span className="font-mono">{number}</span> was not found in the system.</p>
      </div>
    </div>
  )

  // ── Asset QR result ────────────────────────────────────────────────────────
  if (assetData) {
    const a = assetData
    const statusColor =
      a.status === 'Available' ? 'bg-green-50 border-green-100' :
      a.status === 'Issued'    ? 'bg-yellow-50 border-yellow-100' :
                                 'bg-red-50 border-red-100'
    const badgeClass =
      a.status === 'Available' ? 'badge-available' :
      a.status === 'Issued'    ? 'badge-issued' :
                                 'badge-broken'
    const contactNumber = (a.mobileNumber || defaultContactNumber) as string
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-primary-light flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Package size={32} className="text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-white">RSSB Wireless</h1>
            <p className="text-blue-200 text-sm">Asset Tracker</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className={`px-5 py-3 border-b ${statusColor}`}>
              <div className="flex items-center gap-2">
                <span className={badgeClass}>{a.status}</span>
                <span className="text-sm font-medium text-gray-600">{a.assetTypeName}</span>
                {a.itemNumber && <span className="ml-auto text-xs text-gray-400">#{a.itemNumber}</span>}
              </div>
            </div>

            <div className="p-5 space-y-4">
              {a.status === 'Issued' && a.issuedTo ? (
                <>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Currently Issued To</h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User size={18} className="text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{a.issuedTo}</div>
                        <div className="text-xs text-gray-400">Sewadar / Incharge</div>
                      </div>
                    </div>
                    {a.badgeNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Hash size={14} className="text-gray-400" /> Badge: {a.badgeNumber}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400" /> {contactNumber}
                    </div>
                    {a.visitName && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} className="text-gray-400" /> {a.visitName}
                      </div>
                    )}
                  </div>
                </>
              ) : a.status === 'Available' ? (
                <div className="text-center py-4">
                  <CheckCircle size={36} className="text-green-400 mx-auto mb-2" />
                  <p className="text-gray-600">This set is <strong>available</strong> for issue.</p>
                  <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                    <Phone size={14} className="text-gray-400" />
                    <a href={`tel:${contactNumber}`} className="font-medium underline underline-offset-2">{contactNumber}</a>
                  </div>
                </div>
              ) : a.status === 'Broken' ? (
                <div className="text-center py-4">
                  <AlertCircle size={36} className="text-red-400 mx-auto mb-2" />
                  <p className="text-gray-600">This set is marked as <strong>broken / out of service</strong>.</p>
                  <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                    <Phone size={14} className="text-gray-400" />
                    <a href={`tel:${contactNumber}`} className="font-medium underline underline-offset-2">{contactNumber}</a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Package size={36} className="text-orange-400 mx-auto mb-2" />
                  <p className="text-gray-600">This set is currently <strong>issued / allocated</strong>.</p>
                  <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                    <Phone size={14} className="text-gray-400" />
                    <a href={`tel:${contactNumber}`} className="font-medium underline underline-offset-2">{contactNumber}</a>
                  </div>
                </div>
              )}
              {a.brand && (
                <div className="text-sm text-gray-500 text-center">Brand: {a.brand}</div>
              )}
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t text-center">
              <p className="text-xs text-gray-400">RSSB · Asset Equipment System</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-primary-light flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Radio size={32} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white">RSSB Wireless</h1>
          <p className="text-blue-200 text-sm">Bhatti Center — Wireless Tracker</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Status bar */}
          <div className={`px-5 py-3 ${data.status === 'Issued' ? 'bg-yellow-50 border-b border-yellow-100' :
            data.status === 'Available' ? 'bg-green-50 border-b border-green-100' :
            'bg-red-50 border-b border-red-100'}`}>
            <div className="flex items-center gap-2">
              <span className={data.status === 'Issued' ? 'badge-issued' : data.status === 'Available' ? 'badge-available' : 'badge-broken'}>
                {data.status}
              </span>
              <span className="text-sm font-medium text-gray-600">Set #{data.setNumber}</span>
              <span className="ml-auto text-xs text-gray-400">{data.brand}</span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {data.status === 'Issued' && data.issuedTo ? (
              <>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Currently Issued To</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{data.issuedTo}</div>
                      <div className="text-xs text-gray-400">Sewadar / Incharge</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Hash size={14} className="text-gray-400" /> Badge: {data.badgeNumber}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400" /> {data.mobileNumber}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="text-gray-400" /> {data.visitName}
                  </div>
                </div>
              </>
            ) : data.status === 'Available' ? (
              <div className="text-center py-4">
                <CheckCircle size={36} className="text-green-400 mx-auto mb-2" />
                <p className="text-gray-600">This set is <strong>available</strong> for issue.</p>
                <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                  <Phone size={14} className="text-gray-400" />
                  <a href={`tel:${defaultContactNumber}`} className="font-medium underline underline-offset-2">{defaultContactNumber}</a>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle size={36} className="text-red-400 mx-auto mb-2" />
                <p className="text-gray-600">This set is marked as broken/out of service.</p>
              </div>
            )}
          </div>

          <div className="px-5 py-3 bg-gray-50 border-t text-center">
            <p className="text-xs text-gray-400">RSSB Bhatti Center · Wireless Equipment System</p>
          </div>
        </div>
      </div>
    </div>
  )
}
