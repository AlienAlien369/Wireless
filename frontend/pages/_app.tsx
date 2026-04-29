import type { AppProps } from 'next/app'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from '../components/ErrorBoundary'
import '../styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
  },
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Component {...pageProps} />
        <Toaster position="top-right" toastOptions={{
          success: { style: { background: '#1e3a5f', color: '#fff' } },
          error: { style: { background: '#dc2626', color: '#fff' } },
        }} />
      </ErrorBoundary>
    </QueryClientProvider>
  )
}
