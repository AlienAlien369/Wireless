import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function LegacyScannerRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/issue-assets') }, [router])
  return null
}
