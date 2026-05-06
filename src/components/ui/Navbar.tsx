/**
 * Navbar - Thanh điều hướng public
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Image, Calendar, Settings, GitBranch } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/album', label: 'Album ảnh', icon: Image },
  { href: '/calendar', label: 'Lịch gia đình', icon: Calendar },
  { href: '/family', label: 'Gia phả', icon: GitBranch },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f]/90 backdrop-blur-md border-b border-[#1a1a1a]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-[#c9a84c]/20 flex items-center justify-center border border-[#c9a84c]/30 group-hover:bg-[#c9a84c]/30 transition-colors">
            <span className="text-[#c9a84c] text-sm font-bold">GĐ</span>
          </div>
          <span className="text-white font-semibold tracking-wide hidden sm:block">
            {process.env.NEXT_PUBLIC_APP_NAME ?? 'Gia Đình Tôi'}
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-[#c9a84c]/15 text-[#c9a84c] font-medium'
                    : 'text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:block">{label}</span>
              </Link>
            )
          })}

          {/* Admin link */}
          <Link
            href="/admin/login"
            className="ml-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#666] hover:text-[#c9a84c] hover:bg-[#1a1a1a] transition-all duration-200"
            title="Trang quản trị"
          >
            <Settings size={16} />
          </Link>
        </div>
      </div>
    </nav>
  )
}
