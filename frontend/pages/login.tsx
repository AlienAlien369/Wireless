import { useState } from 'react'
import { useRouter } from 'next/router'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Wifi, Lock, User } from 'lucide-react'
import { authApi } from '../services/api'

interface LoginForm {
  username: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const res = await authApi.login(data.username, data.password)
      const u = res.data
      localStorage.setItem('token', u.token)
      localStorage.setItem('user', JSON.stringify(u))
      toast.success(`Welcome, ${u.fullName}!`)
      if (u.role === 'Admin') router.push('/admin')
      else router.push('/incharge')
    } catch {
      toast.error('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-dark via-primary to-primary-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wifi size={40} className="text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-white">RSSB Wireless</h1>
          <p className="text-blue-200 mt-1">Bhatti Center — Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign In</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Username / Badge Number</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('username', { required: 'Username is required' })}
                  className="input pl-9"
                  placeholder="Enter username"
                />
              </div>
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('password', { required: 'Password is required' })}
                  type="password"
                  className="input pl-9"
                  placeholder="Enter password"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-xs mt-6">
            RSSB Bhatti Center · Spiritual Visit Equipment Management
          </p>
        </div>
      </div>
    </div>
  )
}
