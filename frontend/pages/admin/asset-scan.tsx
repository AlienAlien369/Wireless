import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/admin/AdminLayout'
import { assetsApi } from '../../services/api'
import { Hash, MapPin, Phone, QrCode, Search, User } from 'lucide-react'
import type { Asset } from '../../types'

/**
 * AssetScanPage  —  /admin/asset-scan
 *
 * Admin utility page for quickly checking an asset's allocation status.
 * Accepts a QR value via keyboard input or a hardware barcode scanner
 * (which emulates keyboard input + Enter).
 *
 * Calls the authenticated scanQr endpoint and displays:
 *   - Asset type, item number, brand
 *   - Colour-coded status badge: Available / Issued / Broken
 *   - When Issued: incharge name, badge, mobile and visit name
 *   - A plain-language message for Available / Broken states
 */

// The scanQr endpoint returns the full enriched object including issue details
type ScannedAsset = Asset & {
  qrValue?: string
  issuedTo?: string | null
  badgeNumber?: string | null
  mobileNumber?: string | null
  visitName?: string | null
}

// Tailwind classes for each status badge
const STATUS_STYLES: Record<string, string> = {
  Available: 'bg-green-100 text-green-800 border-green-300',
  Issued: 'bg-orange-100 text-orange-800 border-orange-300',
  Broken: 'bg-red-100 text-red-800 border-red-300',
}

export default function AssetScanPage() {
  const [qrInput, setQrInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScannedAsset | null>(null)
  const [notFound, setNotFound] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const lookup = async (value?: string) => {
    const raw = (value ?? qrInput).trim()
    if (!raw) return
    setLoading(true)
    setNotFound(false)
    setResult(null)
    try {
      const res = await assetsApi.scanQr(raw)
      setResult({ ...res.data, qrValue: raw })
      setQrInput('')
    } catch (e: any) {
      if (e.response?.status === 404 || e.response?.status === 400) {
        setNotFound(true)
      } else {
        toast.error(e.response?.data?.message || 'Lookup failed')
      }
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') lookup()
  }

  return (
    <AdminLayout title="Asset Status Scan">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="card space-y-4">
          <div className="flex items-center gap-2 font-semibold text-gray-800">
            <QrCode size={18} /> Scan Asset QR
          </div>
          <p className="text-sm text-gray-500">
            Scan or type an asset QR value to instantly see whether it is <span className="text-green-700 font-medium">Available</span>, <span className="text-orange-700 font-medium">Issued</span>, or <span className="text-red-700 font-medium">Broken</span>.
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              className="input flex-1"
              placeholder="Scan QR or type AST-1-2-5..."
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button className="btn-primary flex items-center gap-2" onClick={() => lookup()} disabled={loading}>
              <Search size={16} /> {loading ? 'Looking up...' : 'Lookup'}
            </button>
          </div>
        </div>

        {notFound && (
          <div className="card border-red-200 bg-red-50 text-red-700 text-sm text-center py-6">
            ❌ No asset found for that QR code.
          </div>
        )}

        {result && (
          <div className="card space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-gray-800">{result.assetTypeName}</div>
                {result.itemNumber && (
                  <div className="text-sm text-gray-500">Item # {result.itemNumber}</div>
                )}
                {result.brand && (
                  <div className="text-sm text-gray-500">Brand: {result.brand}</div>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${STATUS_STYLES[result.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {result.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">Type Code</div>
                <div className="font-mono font-medium">{result.assetTypeCode}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs mb-1">Asset ID</div>
                <div className="font-mono font-medium">#{result.id}</div>
              </div>
            </div>

            {result.status === 'Available' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                ✅ This asset is <strong>available</strong> and not currently allocated to anyone.
              </div>
            )}

            {/* When issued, show the incharge details */}
            {result.status === 'Issued' && (
              result.issuedTo ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                  <div className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Currently Issued To</div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                      <User size={16} className="text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{result.issuedTo}</div>
                      <div className="text-xs text-gray-500">Sewadaar / Incharge</div>
                    </div>
                  </div>
                  {result.badgeNumber && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Hash size={13} className="text-gray-400" /> Badge: {result.badgeNumber}
                    </div>
                  )}
                  {result.mobileNumber && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone size={13} className="text-gray-400" />
                      <a href={`tel:${result.mobileNumber}`} className="underline underline-offset-2">{result.mobileNumber}</a>
                    </div>
                  )}
                  {result.visitName && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin size={13} className="text-gray-400" /> {result.visitName}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
                  📦 This asset is currently <strong>issued</strong> / allocated.
                </div>
              )
            )}

            {result.status === 'Broken' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                🔧 This asset is marked as <strong>broken</strong>.
              </div>
            )}

            {result.remarks && (
              <div className="text-xs text-gray-500">Remarks: {result.remarks}</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
