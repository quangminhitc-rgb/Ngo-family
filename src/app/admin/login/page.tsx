'use client'

import { useState, FormEvent, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()
  const { theme, toggle } = useTheme()

  useEffect(() => {
    if (status === 'authenticated') router.push('/admin/dashboard')
  }, [status, router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username || !password) { setError('Vui lòng nhập đầy đủ thông tin'); return }
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { username, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError(result.error === 'CredentialsSignin' ? 'Username hoặc mật khẩu không đúng' : result.error)
    } else {
      router.push('/admin/dashboard')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(124,124,204,0.10) 0%, transparent 70%)' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(var(--border-2) 1px, transparent 1px), linear-gradient(90deg, var(--border-2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Theme toggle */}
      <button onClick={toggle}
        className="fixed top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl transition-all"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-sm relative animate-slide-up">
        {/* App branding */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4"
            style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)' }}>
            <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>GĐ</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
            {process.env.NEXT_PUBLIC_APP_NAME ?? 'Gia Đình Tôi'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Đăng nhập để quản trị</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nhập username"
                autoFocus
                autoComplete="username"
                className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-2)',
                  color: 'var(--text-1)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm transition-all focus:outline-none"
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border-2)',
                    color: 'var(--text-1)',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                  style={{ color: 'var(--text-3)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm animate-fade-in"
                style={{ background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 mt-2"
              style={{ background: 'var(--accent)', color: '#0f0f0f' }}
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-black/30 border-t-black/80 rounded-full animate-spin" />
                : <><LogIn size={16} /> Đăng nhập</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--text-3)' }}>
          Chỉ dành cho thành viên gia đình
        </p>
      </div>
    </div>
  )
}
