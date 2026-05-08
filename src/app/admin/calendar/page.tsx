'use client'

/**
 * Admin Calendar - Quản lý sự kiện & loại sự kiện
 * Hỗ trợ: CRUD events, CRUD event types, ngày âm lịch
 */

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Calendar, X, Check, Tag, RefreshCw, Moon } from 'lucide-react'

interface EventType {
  id: string
  slug: string
  name: string
  emoji: string
  color: string
  isSystem: boolean
  sortOrder: number
}

interface CalEvent {
  id: string
  title: string
  description: string | null
  date: string
  isLunar: boolean
  isRecurring: boolean
  eventType: EventType
}

const EMOJI_OPTIONS = ['🎂','❤️','👨‍👩‍👧‍👦','📌','🎉','🏠','✈️','🌸','🎓','💍','⭐','🎊']
const COLOR_OPTIONS = ['#c9a84c','#52a852','#e05252','#7c7ccc','#52a8a8','#e07852','#a852a8','#528ce0']

const emptyEventForm = {
  title: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  typeId: '',
  isRecurring: false,
  isLunar: false,
}

const emptyTypeForm = {
  name: '',
  emoji: '📌',
  color: '#c9a84c',
}

const MONTHS_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']

export default function AdminCalendarPage() {
  const [tab, setTab] = useState<'events' | 'types'>('events')
  const [events, setEvents] = useState<CalEvent[]>([])
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

  // Event form
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null)
  const [eventForm, setEventForm] = useState(emptyEventForm)
  const [savingEvent, setSavingEvent] = useState(false)

  // Type form
  const [showTypeForm, setShowTypeForm] = useState(false)
  const [editingType, setEditingType] = useState<EventType | null>(null)
  const [typeForm, setTypeForm] = useState(emptyTypeForm)
  const [savingType, setSavingType] = useState(false)

  useEffect(() => {
    fetchTypes()
  }, [])

  useEffect(() => {
    fetchEvents(year)
  }, [year])

  const fetchTypes = async () => {
    try {
      const res = await fetch('/api/event-types')
      const data = await res.json()
      const types = data.types ?? []
      setEventTypes(types)
      if (!emptyEventForm.typeId && types.length > 0) {
        emptyEventForm.typeId = types[0].id
      }
    } catch {}
  }

  const fetchEvents = async (yr: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/events?year=${yr}`)
      const data = await res.json()
      setEvents(data.events ?? [])
    } finally {
      setLoading(false)
    }
  }

  // ── Event CRUD ───────────────────────────────────────────
  const openCreateEvent = () => {
    setEventForm({
      ...emptyEventForm,
      typeId: eventTypes[0]?.id ?? '',
    })
    setEditingEvent(null)
    setShowEventForm(true)
  }

  const openEditEvent = (event: CalEvent) => {
    setEventForm({
      title: event.title,
      description: event.description ?? '',
      date: new Date(event.date).toISOString().split('T')[0],
      typeId: event.eventType.id,
      isRecurring: event.isRecurring,
      isLunar: event.isLunar,
    })
    setEditingEvent(event)
    setShowEventForm(true)
  }

  const handleSaveEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.date || !eventForm.typeId) return
    setSavingEvent(true)
    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events'
      const method = editingEvent ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm),
      })
      if (res.ok) {
        setShowEventForm(false)
        fetchEvents(year)
      }
    } finally {
      setSavingEvent(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Xóa sự kiện này?')) return
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
    if (res.ok) setEvents(prev => prev.filter(e => e.id !== id))
  }

  // ── Event Type CRUD ──────────────────────────────────────
  const openCreateType = () => {
    setTypeForm(emptyTypeForm)
    setEditingType(null)
    setShowTypeForm(true)
  }

  const openEditType = (type: EventType) => {
    setTypeForm({ name: type.name, emoji: type.emoji, color: type.color })
    setEditingType(type)
    setShowTypeForm(true)
  }

  const handleSaveType = async () => {
    if (!typeForm.name.trim()) return
    setSavingType(true)
    try {
      const url = editingType ? `/api/event-types/${editingType.id}` : '/api/event-types'
      const method = editingType ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(typeForm),
      })
      if (res.ok) {
        setShowTypeForm(false)
        fetchTypes()
      }
    } finally {
      setSavingType(false)
    }
  }

  const handleDeleteType = async (id: string) => {
    if (!confirm('Xóa loại sự kiện này? Các sự kiện thuộc loại này sẽ chuyển sang "Sự kiện khác".')) return
    const res = await fetch(`/api/event-types/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchTypes()
      fetchEvents(year)
    }
  }

  // Group events by month
  const groupedEvents = events.reduce<Record<number, CalEvent[]>>((acc, event) => {
    const month = new Date(event.date).getMonth()
    if (!acc[month]) acc[month] = []
    acc[month].push(event)
    return acc
  }, {})

  return (
    <div className="p-4 lg:p-8">
      {/* Page header + tab toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý lịch</h1>
          <p className="text-[#666] text-sm mt-1">
            {tab === 'events' ? `${events.length} sự kiện năm ${year}` : `${eventTypes.length} loại sự kiện`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
            <button
              onClick={() => setTab('events')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === 'events' ? 'bg-[#c9a84c] text-[#0f0f0f]' : 'text-[#666] hover:text-white'
              }`}
            >
              <Calendar size={13} />
              Sự kiện
            </button>
            <button
              onClick={() => setTab('types')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === 'types' ? 'bg-[#c9a84c] text-[#0f0f0f]' : 'text-[#666] hover:text-white'
              }`}
            >
              <Tag size={13} />
              Loại
            </button>
          </div>

          <button
            onClick={tab === 'events' ? openCreateEvent : openCreateType}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c9a84c] text-[#0f0f0f] font-semibold text-sm hover:bg-[#d4b461] transition-all"
          >
            <Plus size={17} />
            {tab === 'events' ? 'Thêm sự kiện' : 'Thêm loại'}
          </button>
        </div>
      </div>

      {/* ── EVENTS TAB ──────────────────────────────────────── */}
      {tab === 'events' && (
        <>
          {/* Year nav */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setYear(y => y - 1)}
              className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[#666] hover:text-white transition-colors text-sm"
            >
              ‹
            </button>
            <span className="text-white font-semibold text-sm w-16 text-center">{year}</span>
            <button
              onClick={() => setYear(y => y + 1)}
              className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[#666] hover:text-white transition-colors text-sm"
            >
              ›
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Calendar size={48} className="text-[#333] mb-4" />
              <p className="text-[#666]">Chưa có sự kiện nào</p>
              <button onClick={openCreateEvent} className="mt-4 text-sm text-[#c9a84c] hover:underline">
                + Thêm sự kiện đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEvents)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([monthIdx, monthEvents]) => (
                  <div key={monthIdx}>
                    <h3 className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">
                      {MONTHS_VI[Number(monthIdx)]}
                    </h3>
                    <div className="space-y-2">
                      {monthEvents
                        .sort((a, b) => new Date(a.date).getDate() - new Date(b.date).getDate())
                        .map(event => {
                          const { emoji, color, name } = event.eventType
                          return (
                            <div
                              key={event.id}
                              className="flex items-center gap-4 p-4 rounded-xl bg-[#111] border border-[#1a1a1a] hover:border-[#222] transition-all group"
                              style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                            >
                              <span className="text-2xl">{emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-white">{event.title}</p>
                                {event.description && (
                                  <p className="text-sm text-[#666] mt-0.5 truncate">{event.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                  <span className="text-xs text-[#555]">
                                    {new Date(event.date).getDate()}/{new Date(event.date).getMonth() + 1}
                                  </span>
                                  {event.isLunar && (
                                    <span className="flex items-center gap-1 text-[10px] text-[#7c7ccc] bg-[#7c7ccc]/10 px-1.5 py-0.5 rounded">
                                      <Moon size={9} />
                                      Âm lịch
                                    </span>
                                  )}
                                  <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}20`, color }}>
                                    {name}
                                  </span>
                                  {event.isRecurring && (
                                    <span className="flex items-center gap-1 text-[10px] text-[#555]">
                                      <RefreshCw size={9} />
                                      Hàng năm
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openEditEvent(event)}
                                  className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#666] hover:text-white transition-colors"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="w-8 h-8 rounded-lg bg-[#e05252]/10 flex items-center justify-center text-[#e05252] hover:bg-[#e05252]/20 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {/* ── TYPES TAB ──────────────────────────────────────── */}
      {tab === 'types' && (
        <div className="space-y-3">
          {eventTypes.map(type => (
            <div
              key={type.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-[#111] border border-[#1a1a1a] hover:border-[#222] transition-all group"
              style={{ borderLeftColor: type.color, borderLeftWidth: 3 }}
            >
              <span className="text-2xl">{type.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white">{type.name}</p>
                  {type.isSystem && (
                    <span className="text-[10px] bg-[#c9a84c]/20 text-[#c9a84c] px-1.5 py-0.5 rounded font-medium">
                      Hệ thống
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#444] mt-0.5">/{type.slug}</p>
              </div>
              <div
                className="w-4 h-4 rounded-full border border-[#333]"
                style={{ backgroundColor: type.color }}
              />
              {!type.isSystem && (
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditType(type)}
                    className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#666] hover:text-white transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteType(type.id)}
                    className="w-8 h-8 rounded-lg bg-[#e05252]/10 flex items-center justify-center text-[#e05252] hover:bg-[#e05252]/20 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Event Form Modal ─────────────────────────────── */}
      {showEventForm && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={e => e.target === e.currentTarget && setShowEventForm(false)}
        >
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl w-full max-w-md shadow-modal animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
              <h3 className="font-semibold text-white">
                {editingEvent ? 'Sửa sự kiện' : 'Thêm sự kiện mới'}
              </h3>
              <button
                onClick={() => setShowEventForm(false)}
                className="w-7 h-7 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#666] hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs text-[#666] mb-1.5 font-medium uppercase tracking-wide">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="VD: Sinh nhật Mẹ"
                  className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#444] text-sm focus:outline-none focus:border-[#c9a84c]/40"
                />
              </div>

              {/* Date + Lunar toggle */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-[#666] font-medium uppercase tracking-wide">
                    Ngày *
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <div
                      onClick={() => setEventForm(f => ({ ...f, isLunar: !f.isLunar }))}
                      className={`w-8 h-4 rounded-full transition-all relative ${eventForm.isLunar ? 'bg-[#7c7ccc]' : 'bg-[#2a2a2a]'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${eventForm.isLunar ? 'left-4.5' : 'left-0.5'}`} />
                    </div>
                    <span className="text-xs text-[#7c7ccc] flex items-center gap-1">
                      <Moon size={11} />
                      Âm lịch
                    </span>
                  </label>
                </div>
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:border-[#c9a84c]/40 [color-scheme:dark]"
                />
                {eventForm.isLunar && (
                  <p className="text-[10px] text-[#7c7ccc]/70 mt-1">
                    Ngày nhập là ngày âm lịch, sẽ tự chuyển sang dương khi hiển thị
                  </p>
                )}
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-xs text-[#666] mb-1.5 font-medium uppercase tracking-wide">
                  Loại sự kiện
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {eventTypes.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setEventForm(f => ({ ...f, typeId: type.id }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                        eventForm.typeId === type.id
                          ? 'border-[#c9a84c]/50 bg-[#c9a84c]/10 text-white'
                          : 'border-[#2a2a2a] bg-[#1a1a1a] text-[#666] hover:text-white hover:border-[#333]'
                      }`}
                    >
                      <span>{type.emoji}</span>
                      <span className="truncate">{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-[#666] mb-1.5 font-medium uppercase tracking-wide">
                  Mô tả
                </label>
                <textarea
                  value={eventForm.description}
                  onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Thêm ghi chú..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#444] text-sm focus:outline-none focus:border-[#c9a84c]/40 resize-none"
                />
              </div>

              {/* Recurring */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setEventForm(f => ({ ...f, isRecurring: !f.isRecurring }))}
                  className={`w-10 h-5 rounded-full transition-all ${eventForm.isRecurring ? 'bg-[#c9a84c]' : 'bg-[#2a2a2a]'} relative`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${eventForm.isRecurring ? 'left-[22px]' : 'left-0.5'}`} />
                </div>
                <span className="text-sm text-[#a0a0a0] flex items-center gap-1.5">
                  <RefreshCw size={13} />
                  Lặp lại hàng năm
                </span>
              </label>
            </div>

            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => setShowEventForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#2a2a2a] text-[#666] hover:text-white text-sm transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={savingEvent || !eventForm.title.trim() || !eventForm.typeId}
                className="flex-1 py-2.5 rounded-xl bg-[#c9a84c] text-[#0f0f0f] font-semibold text-sm hover:bg-[#d4b461] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {savingEvent ? (
                  <div className="w-4 h-4 border-2 border-[#0f0f0f]/50 border-t-[#0f0f0f] rounded-full animate-spin" />
                ) : <Check size={15} />}
                {editingEvent ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Type Form Modal ──────────────────────────────── */}
      {showTypeForm && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={e => e.target === e.currentTarget && setShowTypeForm(false)}
        >
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl w-full max-w-sm shadow-modal animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
              <h3 className="font-semibold text-white">
                {editingType ? 'Sửa loại sự kiện' : 'Thêm loại mới'}
              </h3>
              <button
                onClick={() => setShowTypeForm(false)}
                className="w-7 h-7 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#666] hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs text-[#666] mb-1.5 font-medium uppercase tracking-wide">
                  Tên loại *
                </label>
                <input
                  type="text"
                  value={typeForm.name}
                  onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Du lịch"
                  className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#444] text-sm focus:outline-none focus:border-[#c9a84c]/40"
                />
              </div>

              {/* Emoji picker */}
              <div>
                <label className="block text-xs text-[#666] mb-1.5 font-medium uppercase tracking-wide">
                  Emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setTypeForm(f => ({ ...f, emoji: em }))}
                      className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${
                        typeForm.emoji === em ? 'bg-[#c9a84c]/20 border border-[#c9a84c]/40' : 'bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#333]'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={typeForm.emoji}
                    onChange={e => setTypeForm(f => ({ ...f, emoji: e.target.value }))}
                    maxLength={2}
                    placeholder="✏️"
                    className="w-9 h-9 text-center text-xl bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#c9a84c]/40"
                  />
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-xs text-[#666] mb-1.5 font-medium uppercase tracking-wide">
                  Màu sắc
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTypeForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        typeForm.color === c ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={typeForm.color}
                    onChange={e => setTypeForm(f => ({ ...f, color: e.target.value }))}
                    className="w-7 h-7 rounded-full border border-[#2a2a2a] cursor-pointer bg-transparent"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center gap-3">
                <span className="text-2xl">{typeForm.emoji}</span>
                <div>
                  <p className="text-white text-sm font-medium">{typeForm.name || 'Tên loại'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: typeForm.color }} />
                    <p className="text-xs" style={{ color: typeForm.color }}>{typeForm.name || 'preview'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => setShowTypeForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#2a2a2a] text-[#666] hover:text-white text-sm transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveType}
                disabled={savingType || !typeForm.name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#c9a84c] text-[#0f0f0f] font-semibold text-sm hover:bg-[#d4b461] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {savingType ? (
                  <div className="w-4 h-4 border-2 border-[#0f0f0f]/50 border-t-[#0f0f0f] rounded-full animate-spin" />
                ) : <Check size={15} />}
                {editingType ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
