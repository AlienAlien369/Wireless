import type { AppProps } from 'next/app'
import { Toaster } from 'react-hot-toast'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster position="top-right" toastOptions={{
        success: { style: { background: '#1e3a5f', color: '#fff' } },
        error: { style: { background: '#dc2626', color: '#fff' } },
      }} />
    </>
  )
}
