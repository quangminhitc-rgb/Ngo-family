/**
 * Trang Lịch gia đình - Public
 */

import { Navbar } from '@/components/ui/Navbar'
import { YearCalendar } from '@/components/calendar/YearCalendar'
import { Calendar } from 'lucide-react'

export const metadata = { title: 'Lịch Gia Đình' }

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#52a852]/30 bg-[#52a852]/10 text-[#52a852] text-sm font-medium mb-4">
            <Calendar size={14} />
            Lịch gia đình
          </div>
          <h1 className="text-4xl font-bold text-white">
            Những ngày đặc biệt
          </h1>
          <p className="text-[#666] mt-3 max-w-md mx-auto">
            Sinh nhật, kỷ niệm và các sự kiện quan trọng của gia đình
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {[
            { color: '#52a852', label: 'Sinh nhật', emoji: '🎂' },
            { color: '#e05252', label: 'Kỷ niệm', emoji: '❤️' },
            { color: '#c9a84c', label: 'Họp mặt', emoji: '👨‍👩‍👧‍👦' },
            { color: '#7c7ccc', label: 'Sự kiện khác', emoji: '📌' },
          ].map(({ color, label, emoji }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-[#a0a0a0]">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span>{emoji} {label}</span>
            </div>
          ))}
        </div>

        <YearCalendar />
      </main>
    </div>
  )
}
