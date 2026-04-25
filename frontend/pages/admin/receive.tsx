import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function LegacyReceiveRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/receive-assets') }, [router])
  return null
}
