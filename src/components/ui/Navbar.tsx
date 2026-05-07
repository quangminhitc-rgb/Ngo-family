'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Image, Calendar, GitBranch, Settings, Sun, Moon, ChevronRight, X } from 'lucide-react'
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
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* ── Desktop top bar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-full bg-[var(--accent-bg)] flex items-center justify-center border border-[var(--accent-bd)]">
              <span className="text-[var(--accent)] text-xs font-bold">GĐ</span>
            </div>
            <span className="text-[var(--text-1)] font-semibold tracking-wide text-sm hidden sm:block">
              {process.env.NEXT_PUBLIC_APP_NAME ?? 'Gia Đình Tôi'}
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    active
                      ? 'bg-[var(--accent-bg)] text-[var(--accent)] font-medium'
                      : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]'
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
            {/* Theme toggle */}
            <button onClick={toggle}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] transition-all"
              title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Admin */}
            <Link href="/admin/login"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] transition-all"
              title="Trang quản trị"
            >
              <Settings size={15} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Mobile: left-edge tab trigger ── */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center w-5 h-20 bg-[var(--surface)] border border-l-0 border-[var(--border)] rounded-r-xl shadow-md text-[var(--text-3)] hover:text-[var(--accent)] transition-colors"
        aria-label="Mở menu"
      >
        <ChevronRight size={14} />
      </button>

      {/* ── Mobile: backdrop ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile: slide-in panel ── */}
      <div className={`md:hidden fixed top-0 left-0 h-full w-64 z-50 bg-[var(--surface)] border-r border-[var(--border)] shadow-lg flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[var(--accent-bg)] flex items-center justify-center border border-[var(--accent-bd)]">
              <span className="text-[var(--accent)] text-[10px] font-bold">GĐ</span>
            </div>
            <span className="text-[var(--text-1)] font-semibold text-sm">
              {process.env.NEXT_PUBLIC_APP_NAME ?? 'Gia Đình Tôi'}
            </span>
          </div>
          <button onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? 'bg-[var(--accent-bg)] text-[var(--accent)] font-medium border border-[var(--accent-bd)]'
                    : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <Icon size={17} />
                {label}
                {active && <ChevronRight size={13} className="ml-auto text-[var(--accent)]/60" />}
              </Link>
            )
          })}
        </nav>

        {/* Panel footer */}
        <div className="px-3 py-4 border-t border-[var(--border)] space-y-1">
          <button onClick={toggle}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-all"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            {theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
          </button>
          <Link href="/admin/login" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-all"
          >
            <Settings size={17} />
            Quản trị
          </Link>
        </div>
      </div>
    </>
  )
}
