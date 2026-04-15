import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Wifi, KeyRound, ShieldCheck } from 'lucide-react'
import { authApi } from '../services/api'
import { useRouter } from 'next/router'

type Step = 'request' | 'reset'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('request')
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)

  const requestForm = useForm<{ identifier: string }>()
  const resetForm = useForm<{ otp: string; newPassword: string }>()

  const requestOtp = async (data: { identifier: string }) => {
    setLoading(true)
    try {
      await authApi.forgotPassword(data.identifier)
      setIdentifier(data.identifier)
      toast.success('If the account exists, an OTP has been sent.')
      setStep('reset')
    } catch {
      toast.success('If the account exists, an OTP has been sent.')
      setStep('reset')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (data: { otp: string; newPassword: string }) => {
    setLoading(true)
    try {
      await authApi.resetPassword(identifier, data.otp, data.newPassword)
      toast.success('Password reset successfully')
      router.push('/login')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-primary-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Wifi size={32} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-blue-200 mt-1">OTP via SMS / Email</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {step === 'request' ? (
            <>
              <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold">
                <ShieldCheck size={18} /> Request OTP
              </div>
              <form onSubmit={requestForm.handleSubmit(requestOtp)} className="space-y-4">
                <div>
                  <label className="label">Username / Email / Phone</label>
                  <input
                    className="input"
                    placeholder="e.g. admin or user@domain.com or +91..."
                    {...requestForm.register('identifier', { required: true })}
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full btn-primary">
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold">
                <KeyRound size={18} /> Set New Password
              </div>
              <div className="text-xs text-gray-500 mb-4">
                OTP sent to available channels for: <span className="font-medium text-gray-800">{identifier}</span>
              </div>
              <form onSubmit={resetForm.handleSubmit(resetPassword)} className="space-y-4">
                <div>
                  <label className="label">OTP</label>
                  <input className="input" placeholder="6-digit OTP" {...resetForm.register('otp', { required: true })} />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Enter a strong password"
                    {...resetForm.register('newPassword', { required: true, minLength: 6 })}
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full btn-primary">
                  {loading ? 'Updating...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

