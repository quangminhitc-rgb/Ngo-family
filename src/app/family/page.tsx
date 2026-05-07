'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/ui/Navbar'
import { FamilyTree, type FamilyMember } from '@/components/family/FamilyTree'
import { GitBranch } from 'lucide-react'

export default function FamilyPage() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/family')
      .then(r => r.json())
      .then(d => setMembers(d.members ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-4"
            style={{ border: '1px solid rgba(124,124,204,0.3)', background: 'rgba(124,124,204,0.1)', color: '#7c7ccc' }}>
            <GitBranch size={14} />
            Cây gia phả
          </div>
          <h1 className="text-4xl font-bold" style={{ color: 'var(--text-1)' }}>Cây Gia Phả</h1>
          <p className="mt-3 max-w-md mx-auto" style={{ color: 'var(--text-3)' }}>
            Kết nối các thế hệ, lưu giữ nguồn cội gia đình
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-6">
            {[3, 2, 4].map((n, gi) => (
              <div key={gi} className="flex gap-6 justify-center">
                {Array.from({ length: n }).map((_, i) => (
                  <div key={i} className="skeleton w-28 h-36 rounded-xl" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl p-6 min-h-[400px]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <FamilyTree members={members} />
          </div>
        )}

        {/* Legend */}
        {!loading && members.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs" style={{ color: 'var(--text-3)' }}>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
              Nam
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ec4899]" />
              Nữ
            </span>
            <span className="flex items-center gap-2">
              <div className="w-8 h-0.5 rounded bg-[#c9a84c] opacity-70" />
              Vợ/Chồng
            </span>
            <span className="flex items-center gap-2">
              <div className="w-px h-4" style={{ background: 'var(--border-2)' }} />
              Cha mẹ – Con cái
            </span>
            <span>Nhấn vào thành viên để xem chi tiết</span>
          </div>
        )}
      </main>
    </div>
  )
}
