'use client'

/**
 * Trang Cây Gia Phả - Public
 */

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
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#7c7ccc]/30 bg-[#7c7ccc]/10 text-[#7c7ccc] text-sm font-medium mb-4">
            <GitBranch size={14} />
            Cây gia phả
          </div>
          <h1 className="text-4xl font-bold text-white">Cây Gia Phả</h1>
          <p className="text-[#666] mt-3 max-w-md mx-auto">
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
          <div className="bg-[#0a0a0a] rounded-2xl border border-[#1a1a1a] p-6 min-h-[400px]">
            <FamilyTree members={members} />
          </div>
        )}

        {/* Legend */}
        {!loading && members.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#555]">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#3a6ea8]" />
              Nam
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#a83a8c]" />
              Nữ
            </span>
            <span className="flex items-center gap-2">
              <div className="w-8 h-px bg-[#c9a84c50]" />
              Vợ/Chồng
            </span>
            <span className="flex items-center gap-2">
              <div className="w-px h-4 bg-[#2a2a2a]" />
              Cha mẹ - Con cái
            </span>
            <span>Nhấn vào thành viên để xem chi tiết</span>
          </div>
        )}
      </main>
    </div>
  )
}
