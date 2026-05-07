'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/ui/Navbar'
import { Image as ImageIcon, Calendar, GitBranch, ArrowRight, Heart, PartyPopper } from 'lucide-react'

interface BirthdayEvent {
  id: string
  title: string
  eventType: { emoji: string; color: string }
}

export default function HomePage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Gia Đình Tôi'

  const [bgUrl, setBgUrl] = useState<string | null>(null)
  const [birthdays, setBirthdays] = useState<BirthdayEvent[]>([])
  const [showBirthdayPopup, setShowBirthdayPopup] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { if (d.settings?.home_background) setBgUrl(d.settings.home_background) })
      .catch(() => {})

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

  const features = [
    { icon: ImageIcon, title: 'Album Ảnh',     description: 'Lưu giữ khoảnh khắc đáng nhớ qua từng năm tháng.', href: '/album',    color: '#c9a84c' },
    { icon: Calendar,  title: 'Lịch Gia Đình', description: 'Sinh nhật, kỷ niệm và những ngày đặc biệt.',       href: '/calendar', color: '#52a852' },
    { icon: GitBranch, title: 'Cây Gia Phả',   description: 'Kết nối các thế hệ, lưu giữ nguồn cội gia đình.', href: '/family',   color: '#7c7ccc' },
  ]

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
      <Navbar />

      {/* Background image */}
      {bgUrl && (
        <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bgUrl})` }}>
          <div className="absolute inset-0 bg-black/60 dark:bg-black/75" />
        </div>
      )}

      {/* Birthday Popup */}
      {showBirthdayPopup && birthdays.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="rounded-2xl shadow-lg w-full max-w-sm p-6 text-center animate-slide-up"
            style={{ background: 'var(--surface)', border: '1px solid var(--accent-bd)' }}>
            <div className="text-5xl mb-3">🎂</div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <PartyPopper size={18} style={{ color: 'var(--accent)' }} />
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>Sinh nhật hôm nay!</h2>
              <PartyPopper size={18} style={{ color: 'var(--accent)', transform: 'scaleX(-1)' }} />
            </div>
            <div className="space-y-2 my-4">
              {birthdays.map(ev => (
                <div key={ev.id} className="px-4 py-2.5 rounded-xl"
                  style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)' }}>
                  <p className="font-semibold" style={{ color: 'var(--text-1)' }}>{ev.title}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--accent)' }}>Chúc mừng sinh nhật! 🎉</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowBirthdayPopup(false)}
              className="mt-2 px-6 py-2 rounded-xl font-semibold text-sm hover:opacity-90 transition-all"
              style={{ background: 'var(--accent)', color: '#0f0f0f' }}
            >
              Cảm ơn 💛
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="relative z-10 pt-14">
        {/* Hero */}
        <section className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center">
          {!bgUrl && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px]"
                style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)' }} />
            </div>
          )}

          <div className="mb-5 px-4 py-1.5 rounded-full inline-flex items-center gap-2 text-sm font-medium"
            style={{ border: '1px solid var(--accent-bd)', background: 'var(--accent-bg)', color: 'var(--accent)' }}>
            <Heart size={13} fill="currentColor" />
            Không gian riêng của gia đình
          </div>

          <h1 className={`text-4xl sm:text-6xl font-bold mb-5 leading-tight tracking-tight ${bgUrl ? 'text-white drop-shadow-lg' : ''}`}
            style={bgUrl ? {} : { color: 'var(--text-1)' }}>
            {appName}
          </h1>

          <p className={`text-base sm:text-lg max-w-xl mb-0 leading-relaxed ${bgUrl ? 'text-white/80' : ''}`}
            style={bgUrl ? {} : { color: 'var(--text-2)' }}>
            Nơi lưu giữ những kỷ niệm, chia sẻ yêu thương và kết nối mọi thành viên trong gia đình.
          </p>
        </section>

        {/* Feature cards */}
        <section className="max-w-5xl mx-auto px-4 pb-24 -mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, description, href, color }) => (
              <Link key={href} href={href}
                className="group p-7 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${color}18`, border: `1px solid ${color}35` }}>
                  <Icon size={21} style={{ color }} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-1)' }}>{title}</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-3)' }}>{description}</p>
                <div className="flex items-center gap-1 text-sm font-medium transition-all group-hover:gap-2" style={{ color }}>
                  Xem ngay <ArrowRight size={13} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 py-6 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          Made with <Heart size={11} className="inline" fill="var(--accent)" style={{ color: 'var(--accent)' }} /> for family
        </p>
      </footer>
    </div>
  )
}
