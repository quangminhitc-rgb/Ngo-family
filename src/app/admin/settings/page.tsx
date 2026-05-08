'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Bell, BellOff, Info, AlertTriangle, CheckCircle, AlertCircle, Check } from 'lucide-react'

const ANN_TYPES = [
  { value: 'info',    label: 'Thông tin', icon: Info,          color: '#5588cc' },
  { value: 'warning', label: 'Cảnh báo',  icon: AlertTriangle, color: '#c9a84c' },
  { value: 'success', label: 'Tốt lành',  icon: CheckCircle,   color: '#52a852' },
  { value: 'danger',  label: 'Khẩn cấp',  icon: AlertCircle,   color: '#e05252' },
] as const

type AnnType = typeof ANN_TYPES[number]['value']

export default function AdminSettingsPage() {
  // Background
  const [bgUrl, setBgUrl]         = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [clearing, setClearing]   = useState(false)
  const fileRef                   = useRef<HTMLInputElement>(null)

  // Announcement
  const [annEnabled,  setAnnEnabled]  = useState(false)
  const [annType,     setAnnType]     = useState<AnnType>('info')
  const [annTitle,    setAnnTitle]    = useState('')
  const [annContent,  setAnnContent]  = useState('')
  const [annSaving,   setAnnSaving]   = useState(false)
  const [annSaved,    setAnnSaved]    = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        const s = d.settings ?? {}
        if (s.home_background) setBgUrl(s.home_background)
        setAnnEnabled(s.announcement_enabled === 'true')
        setAnnType((s.announcement_type as AnnType) ?? 'info')
        setAnnTitle(s.announcement_title ?? '')
        setAnnContent(s.announcement_content ?? '')
      })
      .catch(() => {})
  }, [])

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('background', file)
      const res  = await fetch('/api/settings', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setBgUrl(data.url)
    } finally {
      setUploading(false)
    }
  }

  const handleClear = async () => {
    setClearing(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_background: '' }),
      })
      setBgUrl(null)
    } finally {
      setClearing(false)
    }
  }

  const handleSaveAnnouncement = async () => {
    setAnnSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcement_enabled: annEnabled ? 'true' : 'false',
          announcement_type:    annType,
          announcement_title:   annTitle,
          announcement_content: annContent,
        }),
      })
      setAnnSaved(true)
      setTimeout(() => setAnnSaved(false), 2000)
    } finally {
      setAnnSaving(false)
    }
  }

  const activeType = ANN_TYPES.find(t => t.value === annType) ?? ANN_TYPES[0]

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Cài đặt</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Tùy chỉnh giao diện trang web</p>
      </div>

      {/* Background image */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <h2 className="font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Ảnh nền trang chủ</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>
          Ảnh hiển thị phía sau nội dung trang chủ. Nên dùng ảnh ngang, độ phân giải cao.
        </p>
        <div
          className="relative mb-4 rounded-xl overflow-hidden"
          style={{ aspectRatio: '16/7', background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          {bgUrl ? (
            <>
              <img src={bgUrl} alt="Background preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <span className="text-white text-sm font-medium">Ảnh nền hiện tại</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <ImageIcon size={36} style={{ color: 'var(--text-3)' }} />
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Chưa có ảnh nền</p>
            </div>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60 transition-all"
            style={{ background: 'var(--accent)', color: '#0f0f0f' }}
          >
            {uploading
              ? <div className="w-4 h-4 border-2 border-black/30 border-t-black/80 rounded-full animate-spin" />
              : <Upload size={15} />}
            {bgUrl ? 'Thay ảnh nền' : 'Tải ảnh nền lên'}
          </button>
          {bgUrl && (
            <button
              onClick={handleClear}
              disabled={clearing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm disabled:opacity-60 transition-all"
              style={{ border: '1px solid var(--danger)', color: 'var(--danger)' }}
            >
              {clearing
                ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--danger)', borderTopColor: 'transparent' }} />
                : <X size={15} />}
              Xóa ảnh nền
            </button>
          )}
        </div>
      </div>

      {/* Announcement */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        {/* Section header + toggle */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Thông báo quan trọng</h2>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              Hiển thị popup thông báo cho tất cả thành viên khi vào trang.
            </p>
          </div>
          {/* Toggle switch */}
          <button
            onClick={() => setAnnEnabled(v => !v)}
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            style={annEnabled
              ? { background: 'rgba(82,168,82,0.15)', color: '#52a852', border: '1px solid rgba(82,168,82,0.3)' }
              : { background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }
            }
          >
            {annEnabled ? <Bell size={15} /> : <BellOff size={15} />}
            {annEnabled ? 'Đang bật' : 'Đã tắt'}
          </button>
        </div>

        <div className={`space-y-4 transition-opacity ${annEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          {/* Type selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>
              Loại thông báo
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ANN_TYPES.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setAnnType(value)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
                  style={annType === value
                    ? { background: `${color}18`, color, border: `1px solid ${color}40` }
                    : { background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }
                  }
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-3)' }}>
              Tiêu đề
            </label>
            <input
              type="text"
              value={annTitle}
              onChange={e => setAnnTitle(e.target.value)}
              placeholder="VD: Họp mặt gia đình tháng 6"
              className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-2)',
                color: 'var(--text-1)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = `${activeType.color}50`)}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-3)' }}>
              Nội dung
            </label>
            <textarea
              value={annContent}
              onChange={e => setAnnContent(e.target.value)}
              rows={4}
              placeholder="Nhập nội dung thông báo..."
              className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none transition-all"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-2)',
                color: 'var(--text-1)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = `${activeType.color}50`)}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
            />
          </div>

          {/* Preview */}
          {(annTitle || annContent) && (
            <div
              className="p-4 rounded-xl"
              style={{
                background: `${activeType.color}10`,
                border: `1px solid ${activeType.color}30`,
              }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>
                Xem trước
              </p>
              <div className="flex items-start gap-3">
                <activeType.icon size={16} style={{ color: activeType.color }} className="flex-shrink-0 mt-0.5" />
                <div>
                  {annTitle && (
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{annTitle}</p>
                  )}
                  {annContent && (
                    <p className="text-sm mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>{annContent}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleSaveAnnouncement}
            disabled={annSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60 transition-all"
            style={{ background: 'var(--accent)', color: '#0f0f0f' }}
          >
            {annSaving
              ? <div className="w-4 h-4 border-2 border-black/30 border-t-black/80 rounded-full animate-spin" />
              : annSaved
              ? <Check size={15} />
              : <Bell size={15} />}
            {annSaved ? 'Đã lưu!' : 'Lưu thông báo'}
          </button>
          {annSaved && (
            <p className="text-sm" style={{ color: '#52a852' }}>Thay đổi đã được áp dụng</p>
          )}
        </div>
      </div>
    </div>
  )
}
