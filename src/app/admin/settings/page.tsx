'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

export default function AdminSettingsPage() {
  const [bgUrl, setBgUrl]         = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [clearing, setClearing]   = useState(false)
  const fileRef                   = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { if (d.settings?.home_background) setBgUrl(d.settings.home_background) })
      .catch(() => {})
  }, [])

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('background', file)
      const res = await fetch('/api/settings', { method: 'POST', body: fd })
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

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Cài đặt</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Tùy chỉnh giao diện trang web</p>
      </div>

      {/* Background image card */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <h2 className="font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Ảnh nền trang chủ</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>
          Ảnh hiển thị phía sau nội dung trang chủ. Nên dùng ảnh ngang, độ phân giải cao.
        </p>

        {/* Preview */}
        <div className="relative mb-4 rounded-xl overflow-hidden"
          style={{ aspectRatio: '16/7', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
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

        {/* Action buttons */}
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
    </div>
  )
}
