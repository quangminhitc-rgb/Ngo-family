'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'

const TYPE_CONFIG = {
  info:    { icon: Info,          color: '#5588cc', bg: 'rgba(85,136,204,0.12)',  border: 'rgba(85,136,204,0.3)'  },
  warning: { icon: AlertTriangle, color: '#c9a84c', bg: 'rgba(201,168,76,0.12)', border: 'rgba(201,168,76,0.3)' },
  success: { icon: CheckCircle,   color: '#52a852', bg: 'rgba(82,168,82,0.12)',  border: 'rgba(82,168,82,0.3)'  },
  danger:  { icon: AlertCircle,   color: '#e05252', bg: 'rgba(224,82,82,0.12)',  border: 'rgba(224,82,82,0.3)'  },
} as const

type AnnouncementType = keyof typeof TYPE_CONFIG

export function AnnouncementPopup() {
  const [show, setShow] = useState(false)
  const [ann, setAnn] = useState<{ title: string; content: string; type: AnnouncementType } | null>(null)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        const s = d.settings ?? {}
        if (s.announcement_enabled !== 'true') return
        const title   = s.announcement_title   ?? ''
        const content = s.announcement_content ?? ''
        const type    = (s.announcement_type ?? 'info') as AnnouncementType
        if (!title && !content) return
        setAnn({ title, content, type })
        setShow(true)
      })
      .catch(() => {})
  }, [])

  const dismiss = () => setShow(false)

  if (!show || !ann) return null

  const cfg = TYPE_CONFIG[ann.type] ?? TYPE_CONFIG.info
  const Icon = cfg.icon

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && dismiss()}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl animate-slide-up"
        style={{
          background: 'var(--surface)',
          border: `1px solid ${cfg.border}`,
          boxShadow: `var(--shadow), 0 0 40px ${cfg.color}18`,
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-5 pb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            <Icon size={18} style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            {ann.title && (
              <h3 className="font-semibold text-base leading-snug" style={{ color: 'var(--text-1)' }}>
                {ann.title}
              </h3>
            )}
          </div>
          <button
            onClick={dismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        {ann.content && (
          <p className="px-5 pb-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>
            {ann.content}
          </p>
        )}

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={dismiss}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  )
}
