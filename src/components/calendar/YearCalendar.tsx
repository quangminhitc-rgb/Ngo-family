/**
 * YearCalendar - Hiển thị toàn bộ 12 tháng trong năm
 * Tính năng: hover tooltip, month view, event list tổng hợp
 */

'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, LayoutGrid, CalendarDays, ListFilter, Flag } from 'lucide-react'
import { MONTHS_VI, DAYS_VI, formatDateLong } from '@/lib/utils'
import { solarToLunar, formatLunarDate } from '@/lib/lunar'
import { buildHolidayMap, type Holiday } from '@/lib/holidays'

interface EventType {
  id: string
  slug: string
  name: string
  emoji: string
  color: string
}

interface CalEvent {
  id: string
  title: string
  description: string | null
  date: string
  isRecurring: boolean
  eventType: EventType
}

type ViewMode = 'year' | 'month'

export function YearCalendar() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('year')
  // Tháng hiện tại khi ở chế độ month view
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth())
  const today = new Date()

  // Ngày lễ nhà nước — tính trước, không cần fetch API
  const holidayMap = useMemo(() => buildHolidayMap(year), [year])

  useEffect(() => {
    fetchEvents(year)
  }, [year])

  const fetchEvents = async (yr: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/events?year=${yr}`)
      const data = await res.json()
      setEvents(data.events ?? [])
    } catch (err) {
      console.error('Error fetching events:', err)
    } finally {
      setLoading(false)
    }
  }

  // Map sự kiện theo key "YYYY-MM-DD"
  const eventMap = events.reduce<Record<string, CalEvent[]>>((acc, event) => {
    const d = new Date(event.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!acc[key]) acc[key] = []
    acc[key].push(event)
    return acc
  }, {})

  // Tất cả sự kiện trong năm, sắp xếp theo ngày
  const allEventsSorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Nhóm sự kiện theo tháng cho event list
  const eventsByMonth = allEventsSorted.reduce<Record<number, CalEvent[]>>((acc, event) => {
    const month = new Date(event.date).getMonth()
    if (!acc[month]) acc[month] = []
    acc[month].push(event)
    return acc
  }, {})

  const switchYear = (delta: number) => {
    setYear(y => y + delta)
  }

  const prevMonth = () => {
    if (activeMonth === 0) { setActiveMonth(11); setYear(y => y - 1) }
    else setActiveMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (activeMonth === 11) { setActiveMonth(0); setYear(y => y + 1) }
    else setActiveMonth(m => m + 1)
  }

  return (
    <div className="space-y-8">
      {/* ── Controls bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Year / Month navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={viewMode === 'year' ? () => switchYear(-1) : prevMonth}
            className="w-9 h-9 rounded-lg bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] flex items-center justify-center text-[#a0a0a0] hover:text-white transition-all"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="text-center min-w-[140px]">
            {viewMode === 'year' ? (
              <span className="text-xl font-bold text-white">{year}</span>
            ) : (
              <button
                onClick={() => setViewMode('year')}
                className="text-xl font-bold text-white hover:text-[#c9a84c] transition-colors"
              >
                {MONTHS_VI[activeMonth]} {year}
              </button>
            )}
          </div>

          <button
            onClick={viewMode === 'year' ? () => switchYear(1) : nextMonth}
            className="w-9 h-9 rounded-lg bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] flex items-center justify-center text-[#a0a0a0] hover:text-white transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
          <button
            onClick={() => setViewMode('year')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'year'
                ? 'bg-[#c9a84c] text-[#0f0f0f]'
                : 'text-[#666] hover:text-white'
            }`}
          >
            <LayoutGrid size={13} />
            Cả năm
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'month'
                ? 'bg-[#c9a84c] text-[#0f0f0f]'
                : 'text-[#666] hover:text-white'
            }`}
          >
            <CalendarDays size={13} />
            Theo tháng
          </button>
        </div>
      </div>

      {/* ── YEAR VIEW: 12 month mini-cards ── */}
      {viewMode === 'year' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MONTHS_VI.map((monthName, monthIdx) => (
            <MiniMonthCard
              key={monthIdx}
              year={year}
              month={monthIdx}
              monthName={monthName}
              eventMap={eventMap}
              holidayMap={holidayMap}
              today={today}
              onMonthClick={() => { setActiveMonth(monthIdx); setViewMode('month') }}
              onDayClick={(day) => { setActiveMonth(monthIdx); setViewMode('month') }}
            />
          ))}
        </div>
      )}

      {/* ── MONTH VIEW: Full single month with inline events ── */}
      {viewMode === 'month' && (
        <FullMonthView
          year={year}
          month={activeMonth}
          eventMap={eventMap}
          holidayMap={holidayMap}
          today={today}
        />
      )}

      {/* ── EVENT LIST: Tổng hợp tất cả ngày đặc biệt + lễ nhà nước ── */}
      {(() => {
        // Gộp family events + holidays vào một danh sách duy nhất theo tháng
        type ListItem =
          | { kind: 'event'; data: CalEvent }
          | { kind: 'holiday'; data: Holiday }

        const byMonth: Record<number, ListItem[]> = {}

        // Thêm family events
        for (const ev of allEventsSorted) {
          const m = new Date(ev.date).getMonth()
          if (!byMonth[m]) byMonth[m] = []
          byMonth[m].push({ kind: 'event', data: ev })
        }

        // Thêm holidays (sắp xếp theo ngày)
        const allHolidays = Array.from(holidayMap.values()).flat()
          .sort((a, b) => a.date.getTime() - b.date.getTime())
        for (const h of allHolidays) {
          const m = h.date.getMonth()
          if (!byMonth[m]) byMonth[m] = []
          byMonth[m].push({ kind: 'holiday', data: h })
        }

        // Sắp theo ngày trong từng tháng
        for (const m of Object.keys(byMonth)) {
          byMonth[Number(m)].sort((a, b) => {
            const da = a.kind === 'event' ? new Date(a.data.date) : a.data.date
            const db = b.kind === 'event' ? new Date(b.data.date) : b.data.date
            return da.getTime() - db.getTime()
          })
        }

        const totalItems = Object.values(byMonth).reduce((s, arr) => s + arr.length, 0)
        if (totalItems === 0) return (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4 text-2xl">📅</div>
            <p className="text-[#666]">Chưa có sự kiện nào trong năm {year}</p>
          </div>
        )

        return (
          <section className="mt-10">
            <div className="flex items-center gap-2 mb-5">
              <ListFilter size={16} className="text-[#c9a84c]" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Tất cả ngày đặc biệt — {year}
              </h2>
              <span className="ml-auto text-xs text-[#555] bg-[#1a1a1a] px-2 py-1 rounded-full border border-[#222]">
                {totalItems} ngày
              </span>
            </div>

            {/* Legend nhỏ */}
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="flex items-center gap-1.5 text-xs text-[#555]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#e05252]/40 border border-[#e05252]/50 inline-block" />
                Lễ nhà nước
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[#555]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#c9a84c]/40 border border-[#c9a84c]/50 inline-block" />
                Sự kiện gia đình
              </span>
            </div>

            <div className="space-y-6">
              {Object.entries(byMonth)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([monthIdx, items]) => (
                  <div key={monthIdx}>
                    <button
                      onClick={() => { setActiveMonth(Number(monthIdx)); setViewMode('month') }}
                      className="flex items-center gap-2 mb-3 w-full group"
                    >
                      <span className="text-xs font-semibold text-[#c9a84c] uppercase tracking-widest">
                        {MONTHS_VI[Number(monthIdx)]}
                      </span>
                      <div className="flex-1 h-px bg-[#1a1a1a]" />
                      <span className="text-[10px] text-[#444] group-hover:text-[#c9a84c] transition-colors">
                        Xem tháng →
                      </span>
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {items.map((item, idx) => {
                        if (item.kind === 'holiday') {
                          const h = item.data
                          return (
                            <div
                              key={`h-${h.key}`}
                              className="flex items-start gap-3 p-3.5 rounded-xl bg-[#111] border border-[#1a1a1a] hover:border-[#222] transition-all"
                              style={{ borderLeftColor: h.color, borderLeftWidth: 3 }}
                            >
                              <div className="flex-shrink-0 w-10 text-center">
                                <div className="text-xl font-bold text-white leading-none">{h.date.getDate()}</div>
                                <div className="text-[10px] text-[#555] mt-0.5 uppercase">
                                  {['CN','T2','T3','T4','T5','T6','T7'][h.date.getDay()]}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-base">{h.emoji}</span>
                                  <p className="font-medium text-white text-sm truncate">{h.title}</p>
                                </div>
                                {h.description && (
                                  <p className="text-[#666] text-xs mt-1 line-clamp-1">{h.description}</p>
                                )}
                                <span
                                  className="inline-block mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded"
                                  style={{ backgroundColor: `${h.color}20`, color: h.color }}
                                >
                                  Lễ nhà nước
                                </span>
                              </div>
                            </div>
                          )
                        }

                        // family event
                        const event = item.data
                        const { emoji, color, name } = event.eventType
                        const d = new Date(event.date)
                        return (
                          <div
                            key={`e-${event.id}`}
                            className="flex items-start gap-3 p-3.5 rounded-xl bg-[#111] border border-[#1a1a1a] hover:border-[#222] transition-all"
                            style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                          >
                            <div className="flex-shrink-0 w-10 text-center">
                              <div className="text-xl font-bold text-white leading-none">{d.getDate()}</div>
                              <div className="text-[10px] text-[#555] mt-0.5 uppercase">
                                {['CN','T2','T3','T4','T5','T6','T7'][d.getDay()]}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{emoji}</span>
                                <p className="font-medium text-white text-sm truncate">{event.title}</p>
                              </div>
                              {event.description && (
                                <p className="text-[#666] text-xs mt-1 line-clamp-1">{event.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}20`, color }}>
                                  {name}
                                </span>
                                {event.isRecurring && (
                                  <span className="text-[10px] text-[#555]">↻ Hàng năm</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )
      })()}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MiniMonthCard — Card thu nhỏ trong Year View
// Hover vào ngày → hiện tooltip ngay lập tức
// ══════════════════════════════════════════════════════════
interface MiniMonthCardProps {
  year: number
  month: number
  monthName: string
  eventMap: Record<string, CalEvent[]>
  holidayMap: Map<string, Holiday[]>
  today: Date
  onMonthClick: () => void
  onDayClick: (day: number) => void
}

function MiniMonthCard({ year, month, monthName, eventMap, holidayMap, today, onMonthClick, onDayClick }: MiniMonthCardProps) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()

  const days: (number | null)[] = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)

  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const [cardHovered, setCardHovered] = useState(false)

  return (
    <div
      className={`bg-[#111] border rounded-xl p-4 transition-all duration-200 overflow-visible cursor-pointer ${
        cardHovered
          ? 'border-[#c9a84c]/30 shadow-[0_4px_24px_rgba(201,168,76,0.08)] -translate-y-0.5'
          : 'border-[#1a1a1a]'
      }`}
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => setCardHovered(false)}
    >
      {/* Month header — click để vào month view */}
      <button
        onClick={onMonthClick}
        className="w-full flex items-center justify-between mb-3 group/header"
      >
        <h3 className={`text-sm font-semibold transition-colors ${cardHovered ? 'text-[#d4b461]' : 'text-[#c9a84c]'}`}>
          {monthName}
        </h3>
        <ChevronRight size={13} className={`transition-colors ${cardHovered ? 'text-[#c9a84c]' : 'text-[#333]'}`} />
      </button>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_VI.map(d => (
          <div key={d} className="text-center text-[10px] text-[#3a3a3a] font-medium py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Days — overflow-visible để tooltip không bị cắt */}
      <div className="grid grid-cols-7 gap-0.5 overflow-visible">
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />

          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayEvents = eventMap[dateKey] ?? []
          const dayHolidays = holidayMap.get(dateKey) ?? []
          const hasEvents   = dayEvents.length > 0
          const hasHolidays = dayHolidays.length > 0
          const hasAnything = hasEvents || hasHolidays

          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day

          const lunar = solarToLunar(day, month + 1, year)
          const lunarLabel = lunar.day === 1
            ? `1/${lunar.month}${lunar.leap ? '⁺' : ''}`
            : String(lunar.day)

          const isHovered = hoveredDay === day && hasAnything

          return (
            <div
              key={day}
              className="relative"
              onMouseEnter={() => hasAnything && setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              onClick={() => onDayClick(day)}
            >
              <div
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-[11px] font-medium transition-all duration-100 select-none cursor-pointer ${
                  isToday
                    ? 'bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40 font-bold hover:bg-[#c9a84c]/30'
                    : hasHolidays
                    ? 'bg-[#e05252]/10 text-[#e05252] border border-[#e05252]/20 hover:bg-[#e05252]/20'
                    : hasEvents
                    ? 'bg-[#1a1a1a] text-white hover:bg-[#222]'
                    : 'text-[#3a3a3a] hover:bg-[#1a1a1a] hover:text-[#666]'
                }`}
              >
                <span className="leading-none">{day}</span>
                <span className={`text-[8px] leading-none mt-0.5 ${
                  lunar.day === 1
                    ? isToday ? 'text-[#c9a84c]/80' : 'text-[#c9a84c]/50'
                    : 'opacity-30'
                }`}>
                  {lunarLabel}
                </span>
                {/* Dots: holidays (red) + events (color) */}
                {hasAnything && (
                  <div className="absolute bottom-0.5 flex gap-0.5 justify-center">
                    {dayHolidays.slice(0, 2).map((h, idx) => (
                      <div key={`h${idx}`} className="w-1 h-1 rounded-full" style={{ backgroundColor: h.color }} />
                    ))}
                    {dayEvents.slice(0, 2).map((e, idx) => (
                      <div key={`e${idx}`} className="w-1 h-1 rounded-full" style={{ backgroundColor: e.eventType?.color ?? '#c9a84c' }} />
                    ))}
                  </div>
                )}
              </div>

              {/* ── Hover Tooltip ── */}
              {isHovered && (
                <div
                  className="absolute z-50 w-60 pointer-events-none animate-fade-in"
                  style={{
                    bottom: 'calc(100% + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-modal p-3 space-y-2">
                    {/* Header ngày */}
                    <div className="pb-2 border-b border-[#222]">
                      <p className="text-white text-xs font-semibold">{day}/{month + 1}/{year}</p>
                      <p className="text-[#c9a84c]/60 text-[10px] mt-0.5">
                        {formatLunarDate(solarToLunar(day, month + 1, year))}
                      </p>
                    </div>

                    {/* Holidays */}
                    {dayHolidays.map(h => (
                      <div key={h.key} className="flex items-start gap-2">
                        <span className="text-sm flex-shrink-0">{h.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-white text-xs font-medium leading-snug">{h.title}</p>
                          {h.description && (
                            <p className="text-[#666] text-[10px] mt-0.5 line-clamp-1">{h.description}</p>
                          )}
                          <p className="text-[10px] mt-0.5" style={{ color: h.color }}>Lễ nhà nước</p>
                        </div>
                      </div>
                    ))}

                    {/* Family events */}
                    {dayEvents.map(event => {
                      const { emoji, color, name } = event.eventType
                      return (
                        <div key={event.id} className="flex items-start gap-2">
                          <span className="text-sm flex-shrink-0">{emoji}</span>
                          <div className="min-w-0">
                            <p className="text-white text-xs font-medium leading-snug">{event.title}</p>
                            {event.description && (
                              <p className="text-[#666] text-[10px] mt-0.5 line-clamp-1">{event.description}</p>
                            )}
                            <p className="text-[10px] mt-0.5" style={{ color }}>
                              {name}{event.isRecurring ? ' · Hàng năm' : ''}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-center">
                    <div className="w-2.5 h-2.5 bg-[#1a1a1a] border-r border-b border-[#2a2a2a] rotate-45 -mt-1.5" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// FullMonthView — Xem theo tháng, hiển thị sự kiện inline
// ══════════════════════════════════════════════════════════
interface FullMonthViewProps {
  year: number
  month: number
  eventMap: Record<string, CalEvent[]>
  holidayMap: Map<string, Holiday[]>
  today: Date
}

function FullMonthView({ year, month, eventMap, holidayMap, today }: FullMonthViewProps) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()

  const days: (number | null)[] = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)

  // Pad cuối để grid đầy đủ hàng
  while (days.length % 7 !== 0) days.push(null)

  return (
    <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-[#1a1a1a]">
        {DAYS_VI.map((d, i) => (
          <div
            key={d}
            className={`py-3 text-center text-xs font-semibold uppercase tracking-wider ${
              i === 0 ? 'text-[#e05252]/70' : 'text-[#444]'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 divide-x divide-[#1a1a1a]">
        {days.map((day, i) => {
          if (!day) {
            return (
              <div
                key={`empty-${i}`}
                className={`min-h-[100px] bg-[#0a0a0a] border-b border-[#1a1a1a] ${
                  i % 7 === 0 ? 'opacity-30' : ''
                }`}
              />
            )
          }

          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayEvents = eventMap[dateKey] ?? []
          const dayHolidays = holidayMap.get(dateKey) ?? []
          const hasEvents = dayEvents.length > 0
          const hasHolidays = dayHolidays.length > 0
          const hasAnything = hasEvents || hasHolidays

          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day

          const isSunday = (i % 7 === 0)

          const lunar = solarToLunar(day, month + 1, year)
          const lunarLabel = lunar.day === 1
            ? `1/${lunar.month}${lunar.leap ? '⁺' : ''}`
            : String(lunar.day)

          return (
            <div
              key={day}
              className={`min-h-[100px] border-b border-[#1a1a1a] p-2 transition-colors ${
                hasAnything ? 'hover:bg-[#1a1a1a]/50' : ''
              } ${isToday ? 'bg-[#c9a84c]/5' : ''} ${hasHolidays && !isToday ? 'bg-[#e05252]/3' : ''}`}
            >
              {/* Day number */}
              <div className="flex items-start justify-between mb-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  isToday
                    ? 'bg-[#c9a84c] text-[#0f0f0f]'
                    : hasHolidays
                    ? 'text-[#e05252]'
                    : isSunday
                    ? 'text-[#e05252]/70'
                    : 'text-[#888]'
                }`}>
                  {day}
                </div>
                <span className={`text-[9px] leading-none mt-1 ${
                  lunar.day === 1 ? 'text-[#c9a84c]/60 font-medium' : 'text-[#333]'
                }`}>
                  {lunarLabel}
                </span>
              </div>

              {/* Inline events & holidays */}
              <div className="space-y-1">
                {dayHolidays.map(h => (
                  <div
                    key={h.key}
                    className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium leading-tight truncate"
                    style={{ backgroundColor: `${h.color}18`, color: h.color, border: `1px solid ${h.color}30` }}
                    title={h.description}
                  >
                    <span className="text-xs flex-shrink-0">{h.emoji}</span>
                    <span className="truncate">{h.title}</span>
                  </div>
                ))}
                {dayEvents.map(event => {
                  const { emoji, color } = event.eventType
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium leading-tight truncate"
                      style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}30` }}
                      title={event.description ?? event.title}
                    >
                      <span className="text-xs flex-shrink-0">{emoji}</span>
                      <span className="truncate">{event.title}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
