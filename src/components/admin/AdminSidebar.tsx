'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Image, Calendar, Users, LogOut,
  Home, ChevronRight, Shield, GitBranch, Menu, X, Sun, Moon, Settings,
} from 'lucide-react'
import { useTheme } from '@/lib/theme'

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/admin/photos',    label: 'Quản lý ảnh',  icon: Image },
  { href: '/admin/calendar',  label: 'Quản lý lịch', icon: Calendar },
  { href: '/admin/family',    label: 'Cây gia phả',   icon: GitBranch },
  { href: '/admin/accounts',  label: 'Tài khoản',    icon: Users,     adminOnly: true },
  { href: '/admin/settings',  label: 'Cài đặt',      icon: Settings,  adminOnly: true },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = () => signOut({ callbackUrl: '/admin/login' })

  const SidebarContent = () => (
    <aside className="h-full w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
      {/* Header */}
      <div className="px-5 h-14 flex items-center gap-3 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-xl bg-[var(--accent-bg)] border border-[var(--accent-bd)] flex items-center justify-center flex-shrink-0">
          <Shield size={16} className="text-[var(--accent)]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-1)] truncate">Quản trị</p>
          <p className="text-xs text-[var(--text-3)] truncate">
            {process.env.NEXT_PUBLIC_APP_NAME ?? 'Gia Đình Tôi'}
          </p>
        </div>
        {/* Close button - mobile only */}
        <button onClick={() => setMobileOpen(false)}
          className="lg:hidden ml-auto w-7 h-7 flex items-center justify-center rounded-lg text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-all"
        >
          <X size={15} />
        </button>
      </div>

      {/* User info */}
      {session && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-bg)] flex items-center justify-center text-[var(--accent)] text-sm font-semibold flex-shrink-0 border border-[var(--accent-bd)]">
              {session.user.displayName?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-[var(--text-1)] font-medium truncate">{session.user.displayName}</p>
              <p className="text-xs text-[var(--accent)]">
                {session.user.role === 'admin' ? '👑 Admin' : '👤 Member'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 pt-3 space-y-0.5 overflow-y-auto">
        {adminLinks.map(({ href, label, icon: Icon, adminOnly }) => {
          if (adminOnly && session?.user.role !== 'admin') return null
          const active = pathname === href
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
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
      <div className="px-3 py-3 border-t border-[var(--border)] space-y-0.5">
        <button onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-all"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
        </button>
        <Link href="/" onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-all"
        >
          <Home size={16} />
          Về trang chủ
        </Link>
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--danger)]/70 hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all"
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full z-40">
        <SidebarContent />
      </div>

      {/* Mobile: top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 z-40 bg-[var(--surface)] border-b border-[var(--border)] flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)] transition-all"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[var(--accent-bg)] border border-[var(--accent-bd)] flex items-center justify-center">
            <Shield size={13} className="text-[var(--accent)]" />
          </div>
          <span className="text-[var(--text-1)] font-semibold text-sm">Quản trị</span>
        </div>
        <button onClick={toggle} className="ml-auto w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-3)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] transition-all">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Mobile: backdrop */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile: slide-in sidebar */}
      <div className={`lg:hidden fixed top-0 left-0 h-full z-50 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </div>
    </>
  )
}
