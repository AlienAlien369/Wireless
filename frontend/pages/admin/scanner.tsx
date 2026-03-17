import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import AdminLayout from '../../components/admin/AdminLayout'
import { inventoryApi } from '../../services/api'
import { QrCode } from 'lucide-react'

export default function ScannerPage() {
  const [result, setResult] = useState<any>(null)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  const startScanner = () => {
    setScanning(true)
    if (scannerRef.current) return
    const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false)
    scanner.render(
      async (text) => {
        const parts = text.split('/')
        const setNumber = parts[parts.length - 1]
        try {
          const res = await inventoryApi.getSetByNumber(setNumber)
          setResult(res.data)
        } catch {
          setResult({ error: 'Set not found: ' + setNumber })
        }
        scanner.clear()
        setScanning(false)
      },
      (err) => console.warn(err)
    )
    scannerRef.current = scanner
  }

  const reset = () => {
    setResult(null)
    scannerRef.current = null
  }

  return (
    <AdminLayout title="QR Scanner">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="card text-center">
          <QrCode size={40} className="text-primary mx-auto mb-3" />
          <h2 className="font-semibold text-gray-700 mb-1">Scan Kenwood Wireless QR Code</h2>
          <p className="text-sm text-gray-500 mb-4">Point your camera at the QR code on the wireless set to view issuance details.</p>

          {!scanning && !result && (
            <button onClick={startScanner} className="btn-primary">Start Scanner</button>
          )}

          <div id="reader" className="mt-4 mx-auto" />

          {result && !result.error && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-left">
              <h3 className="font-bold text-green-800 mb-3">Set Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Set Number:</span><strong>{result.setNumber}</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">Brand:</span><strong>{result.brand}</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">Status:</span>
                  <span className={result.status === 'Issued' ? 'badge-issued' : result.status === 'Available' ? 'badge-available' : 'badge-broken'}>
                    {result.status}
                  </span>
                </div>
                {result.issuedTo && <>
                  <div className="flex justify-between"><span className="text-gray-500">Issued To:</span><strong>{result.issuedTo}</strong></div>
                  <div className="flex justify-between"><span className="text-gray-500">Badge#:</span><span>{result.badgeNumber}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Mobile:</span><span>{result.mobileNumber}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Visit:</span><span>{result.visitName}</span></div>
                </>}
              </div>
              <button onClick={reset} className="mt-4 btn-secondary w-full text-sm">Scan Another</button>
            </div>
          )}

          {result?.error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700">{result.error}</p>
              <button onClick={reset} className="mt-3 btn-secondary text-sm">Try Again</button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
