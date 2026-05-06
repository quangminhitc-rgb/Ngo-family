/**
 * Admin Dashboard - Tổng quan
 */

'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Image, Calendar, Users, ArrowRight, TrendingUp } from 'lucide-react'

interface Stats {
  totalPhotos: number
  totalEvents: number
  totalUsers: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats>({ totalPhotos: 0, totalEvents: 0, totalUsers: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [photosRes, eventsRes, accountsRes] = await Promise.all([
        fetch('/api/photos?limit=1'),
        fetch(`/api/events?year=${new Date().getFullYear()}`),
        fetch('/api/accounts'),
      ])

      const photosData = await photosRes.json()
      const eventsData = await eventsRes.json()
      const accountsData = accountsRes.ok ? await accountsRes.json() : { users: [] }

      setStats({
        totalPhotos: photosData.total ?? 0,
        totalEvents: eventsData.events?.length ?? 0,
        totalUsers: accountsData.users?.length ?? 0,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      icon: Image,
      label: 'Tổng số ảnh',
      value: stats.totalPhotos,
      href: '/admin/photos',
      color: '#c9a84c',
    },
    {
      icon: Calendar,
      label: 'Sự kiện trong năm',
      value: stats.totalEvents,
      href: '/admin/calendar',
      color: '#52a852',
    },
    {
      icon: Users,
      label: 'Thành viên',
      value: stats.totalUsers,
      href: '/admin/accounts',
      color: '#7c7ccc',
      adminOnly: true,
    },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Xin chào, {session?.user.displayName} 👋
        </h1>
        <p className="text-[#666] mt-1">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {statCards.map(({ icon: Icon, label, value, href, color, adminOnly }) => {
          if (adminOnly && session?.user.role !== 'admin') return null
          return (
            <Link
              key={label}
              href={href}
              className="group p-6 rounded-2xl bg-[#111] border border-[#1a1a1a] hover:border-[#2a2a2a] transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <ArrowRight
                  size={16}
                  className="text-[#333] group-hover:text-[#666] group-hover:translate-x-0.5 transition-all"
                />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {loading ? (
                  <div className="skeleton h-8 w-16 rounded" />
                ) : value}
              </div>
              <p className="text-[#666] text-sm">{label}</p>
            </Link>
          )
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-[#666] uppercase tracking-wider mb-4">
          Thao tác nhanh
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <Link
            href="/admin/photos"
            className="flex items-center gap-3 p-4 rounded-xl bg-[#111] border border-[#1a1a1a] hover:border-[#c9a84c]/30 hover:bg-[#c9a84c]/5 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/15 flex items-center justify-center">
              <Image size={16} className="text-[#c9a84c]" />
            </div>
            <span className="text-sm text-[#a0a0a0] group-hover:text-white transition-colors">
              Upload ảnh mới
            </span>
          </Link>
          <Link
            href="/admin/calendar"
            className="flex items-center gap-3 p-4 rounded-xl bg-[#111] border border-[#1a1a1a] hover:border-[#52a852]/30 hover:bg-[#52a852]/5 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#52a852]/15 flex items-center justify-center">
              <Calendar size={16} className="text-[#52a852]" />
            </div>
            <span className="text-sm text-[#a0a0a0] group-hover:text-white transition-colors">
              Thêm sự kiện
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
