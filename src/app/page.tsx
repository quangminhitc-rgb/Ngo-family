'use client'

/**
 * Trang Home – background upload + birthday popup
 */

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Navbar } from '@/components/ui/Navbar'
import { Image as ImageIcon, Calendar, GitBranch, ArrowRight, Heart, Upload, X, PartyPopper } from 'lucide-react'

interface BirthdayEvent {
  id: string
  title: string
  eventType: { emoji: string; color: string }
}

export default function HomePage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Gia Đình Tôi'
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'

  // ── Background state ──────────────────────────────────────
  const [bgUrl, setBgUrl] = useState<string | null>(null)
  const [uploadingBg, setUploadingBg] = useState(false)
  const bgInputRef = useRef<HTMLInputElement>(null)

  // ── Birthday popup state ──────────────────────────────────
  const [birthdays, setBirthdays] = useState<BirthdayEvent[]>([])
  const [showBirthdayPopup, setShowBirthdayPopup] = useState(false)

  useEffect(() => {
    // Load background
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { if (d.settings?.home_background) setBgUrl(d.settings.home_background) })
      .catch(() => {})

    // Check today's birthdays
    const today = new Date()
    fetch(`/api/events?year=${today.getFullYear()}`)
      .then(r => r.json())
      .then(d => {
        const todayBirthdays = (d.events ?? []).filter((ev: any) => {
          const evDate = new Date(ev.date)
          return (
            ev.eventType?.slug === 'birthday' &&
            evDate.getDate() === today.getDate() &&
            evDate.getMonth() === today.getMonth()
          )
        })
        if (todayBirthdays.length > 0) {
          setBirthdays(todayBirthdays)
          setShowBirthdayPopup(true)
        }
      })
      .catch(() => {})
  }, [])

  const handleBgUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploadingBg(true)
    try {
      const fd = new FormData()
      fd.append('background', file)
      const res = await fetch('/api/settings', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setBgUrl(data.url)
    } finally {
      setUploadingBg(false)
    }
  }

  const features = [
    { icon: ImageIcon, title: 'Album Ảnh',     description: 'Lưu giữ khoảnh khắc đáng nhớ qua từng năm tháng.', href: '/album',    color: '#c9a84c' },
    { icon: Calendar,  title: 'Lịch Gia Đình', description: 'Sinh nhật, kỷ niệm và những ngày đặc biệt.',       href: '/calendar', color: '#52a852' },
    { icon: GitBranch, title: 'Cây Gia Phả',   description: 'Kết nối các thế hệ, lưu giữ nguồn cội gia đình.', href: '/family',   color: '#7c7ccc' },
  ]

  return (
    <div className="min-h-screen bg-[#0f0f0f] relative">
      <Navbar />

      {/* ── Background image layer ── */}
      {bgUrl && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgUrl})` }}
        >
          <div className="absolute inset-0 bg-[#0f0f0f]/80" />
        </div>
      )}

      {/* ── Admin: upload background button ── */}
      {isAdmin && (
        <div className="fixed bottom-6 right-6 z-50">
          <input
            ref={bgInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleBgUpload(e.target.files[0])}
          />
          <button
            onClick={() => bgInputRef.current?.click()}
            disabled={uploadingBg}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1a1a1a]/90 border border-[#2a2a2a] text-xs text-[#a0a0a0] hover:text-[#c9a84c] hover:border-[#c9a84c]/40 transition-all backdrop-blur-sm disabled:opacity-50"
            title="Đổi ảnh nền trang chủ"
          >
            {uploadingBg
              ? <div className="w-3.5 h-3.5 border border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
              : <Upload size={14} />
            }
            Đổi nền
          </button>
        </div>
      )}

      {/* ── Birthday Popup ── */}
      {showBirthdayPopup && birthdays.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111] border border-[#c9a84c]/30 rounded-2xl shadow-modal w-full max-w-sm p-6 text-center animate-slide-up">
            <div className="text-5xl mb-3">🎂</div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <PartyPopper size={18} className="text-[#c9a84c]" />
              <h2 className="text-lg font-bold text-white">Sinh nhật hôm nay!</h2>
              <PartyPopper size={18} className="text-[#c9a84c] scale-x-[-1]" />
            </div>
            <div className="space-y-2 my-4">
              {birthdays.map(ev => (
                <div key={ev.id} className="px-4 py-2.5 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20">
                  <p className="text-white font-semibold">{ev.title}</p>
                  <p className="text-[#c9a84c] text-sm mt-0.5">Chúc mừng sinh nhật! 🎉</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowBirthdayPopup(false)}
              className="mt-2 px-6 py-2 rounded-xl bg-[#c9a84c] text-[#0f0f0f] font-semibold text-sm hover:bg-[#d4b461] transition-all"
            >
              Cảm ơn 💛
            </button>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="relative z-10 pt-16">
        {/* Hero */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center px-4 text-center">
          {!bgUrl && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#c9a84c]/5 rounded-full blur-[100px]" />
            </div>
          )}

          <div className="mb-6 px-4 py-1.5 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#c9a84c] text-sm font-medium inline-flex items-center gap-2">
            <Heart size={14} className="fill-[#c9a84c]" />
            Không gian riêng của gia đình
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold text-white mb-6 leading-tight tracking-tight drop-shadow-lg">
            {appName}
          </h1>

          <p className="text-[#a0a0a0] text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed">
            Nơi lưu giữ những kỷ niệm, chia sẻ yêu thương và kết nối mọi thành viên trong gia đình.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/album" className="group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#c9a84c] text-[#0f0f0f] font-semibold hover:bg-[#d4b461] transition-all duration-200 shadow-glow">
              <ImageIcon size={18} />
              Xem Album ảnh
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/calendar" className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#1a1a1a]/80 text-white border border-[#2a2a2a] hover:border-[#c9a84c]/30 hover:bg-[#222]/80 transition-all duration-200 backdrop-blur-sm">
              <Calendar size={18} />
              Lịch gia đình
            </Link>
          </div>
        </section>

        {/* Features grid */}
        <section className="max-w-5xl mx-auto px-4 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, description, href, color }) => (
              <Link
                key={href}
                href={href}
                className="group p-8 rounded-2xl bg-[#111]/80 backdrop-blur-sm border border-[#1a1a1a] hover:border-[#2a2a2a] hover:-translate-y-1 transition-all duration-300 hover:shadow-card"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
                <p className="text-[#666] text-sm leading-relaxed">{description}</p>
                <div className="mt-5 flex items-center gap-1 text-sm font-medium transition-all group-hover:gap-2" style={{ color }}>
                  Xem ngay <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[#1a1a1a] py-8 text-center">
        <p className="text-[#444] text-sm">
          Made with <Heart size={12} className="inline fill-[#c9a84c] text-[#c9a84c]" /> for family
        </p>
      </footer>
    </div>
  )
}
