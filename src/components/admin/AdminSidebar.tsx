/**
 * AdminSidebar - Sidebar điều hướng cho trang quản trị
 */

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Image,
  Calendar,
  Users,
  LogOut,
  Home,
  ChevronRight,
  Shield,
  GitBranch,
} from 'lucide-react'

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/photos', label: 'Quản lý ảnh', icon: Image },
  { href: '/admin/calendar', label: 'Quản lý lịch', icon: Calendar },
  { href: '/admin/family', label: 'Cây gia phả', icon: GitBranch },
  { href: '/admin/accounts', label: 'Tài khoản', icon: Users, adminOnly: true },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/admin/login' })
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#111111] border-r border-[#1a1a1a] flex flex-col z-40">
      {/* Header */}
      <div className="p-6 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#c9a84c]/20 border border-[#c9a84c]/30 flex items-center justify-center">
            <Shield size={18} className="text-[#c9a84c]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Quản trị</p>
            <p className="text-xs text-[#666]">
              {process.env.NEXT_PUBLIC_APP_NAME ?? 'Gia Đình Tôi'}
            </p>
          </div>
        </div>
      </div>

      {/* User info */}
      {session && (
        <div className="px-4 py-3 mx-3 mt-4 rounded-xl bg-[#1a1a1a] border border-[#222]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#c9a84c]/20 flex items-center justify-center text-[#c9a84c] text-sm font-semibold">
              {session.user.displayName?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {session.user.displayName}
              </p>
              <p className="text-xs text-[#c9a84c] capitalize">
                {session.user.role === 'admin' ? '👑 Admin' : '👤 Member'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 space-y-1 overflow-y-auto">
        {adminLinks.map(({ href, label, icon: Icon, adminOnly }) => {
          // Ẩn link admin-only với member
          if (adminOnly && session?.user.role !== 'admin') return null

          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-[#c9a84c]/15 text-[#c9a84c] font-medium border border-[#c9a84c]/20'
                  : 'text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <Icon size={17} className={isActive ? 'text-[#c9a84c]' : ''} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight size={14} className="text-[#c9a84c]/60" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer actions */}
      <div className="p-3 border-t border-[#1a1a1a] space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#666] hover:text-white hover:bg-[#1a1a1a] transition-all duration-200"
        >
          <Home size={17} />
          <span>Về trang chủ</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#e05252]/70 hover:text-[#e05252] hover:bg-[#e05252]/10 transition-all duration-200"
        >
          <LogOut size={17} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}
