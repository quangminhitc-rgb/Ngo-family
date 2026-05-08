'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Image, Calendar, GitBranch, Settings, Sun, Moon, ChevronRight, X, Menu } from 'lucide-react'
import { useTheme } from '@/lib/theme'

const navLinks = [
  { href: '/',         label: 'Trang chủ',    icon: Home },
  { href: '/album',    label: 'Album ảnh',     icon: Image },
  { href: '/calendar', label: 'Lịch gia đình', icon: Calendar },
  { href: '/family',   label: 'Gia phả',       icon: GitBranch },
]

export function Navbar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Gia Đình Tôi'

  return (
    <>
      {/* ── Desktop + Mobile top bar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Mobile: hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[var(--accent-bg)] flex items-center justify-center border border-[var(--accent-bd)]">
              <span className="text-[var(--accent)] text-xs font-bold">GĐ</span>
            </div>
            <span className="text-white font-semibold tracking-wide text-sm hidden sm:block">{appName}</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    active ? 'bg-white/15 text-white font-medium' : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <button onClick={toggle}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link href="/admin/login"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
              title="Trang quản trị"
            >
              <Settings size={15} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Mobile: backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile: slide-in sidebar ── */}
      <div className={`md:hidden fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[var(--accent-bg)] flex items-center justify-center border border-[var(--accent-bd)]">
              <span className="text-[var(--accent)] text-xs font-bold">GĐ</span>
            </div>
            <span className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{appName}</span>
          </div>
          <button onClick={() => setMobileOpen(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ color: 'var(--text-3)' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? 'bg-[var(--accent-bg)] text-[var(--accent)] font-medium border border-[var(--accent-bd)]'
                    : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={13} className="text-[var(--accent)]/60" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 space-y-0.5" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={toggle}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{ color: 'var(--text-2)' }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
          </button>
          <Link href="/admin/login" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{ color: 'var(--text-2)' }}
          >
            <Settings size={16} />
            Quản trị
          </Link>
        </div>
      </div>
    </>
  )
}
