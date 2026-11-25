'use client'

/**
 * Trang Cây gia phả - Public
 * - /family          → dữ liệu thật từ /api/family
 * - /family?demo=1   → dữ liệu demo nhỏ (không cần database)
 * - /family?demo=big → dữ liệu demo lớn (~77 người) để thử thu gọn nhánh
 * Trang quản trị (/admin/family) vẫn dùng FamilyTree cũ vì cần thêm/sửa thành viên.
 */

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/ui/Navbar'
import type { FamilyMember } from '@/components/family/FamilyTree'
import { FamilyTreeView } from '@/components/family/FamilyTreeView'
import { DEMO_MEMBERS, makeBigDemo } from '@/lib/demo-data'
import { GitBranch } from 'lucide-react'

function FamilyContent() {
  const demoParam = useSearchParams().get('demo')
  const demo = demoParam === '1' || demoParam === 'big'
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (demo) {
      setMembers(demoParam === 'big' ? makeBigDemo() : DEMO_MEMBERS)
      setLoading(false)
      return
    }
    fetch('/api/family')
      .then(r => r.json())
      .then(d => setMembers(d.members ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [demo, demoParam])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-4"
            style={{ border: '1px solid rgba(124,124,204,0.3)', background: 'rgba(124,124,204,0.1)', color: '#7c7ccc' }}>
            <GitBranch size={14} />
            Cây gia phả
          </div>
          <h1 className="text-4xl font-bold" style={{ color: 'var(--text-1)' }}>Cây Gia Phả</h1>
          <p className="mt-3 max-w-md mx-auto" style={{ color: 'var(--text-3)' }}>
            Kết nối các thế hệ, lưu giữ nguồn cội gia đình
          </p>
          {demo && (
            <p className="mt-2 text-xs" style={{ color: 'var(--accent)' }}>Đang xem dữ liệu demo</p>
          )}
        </div>

        {loading ? (
          <div className="skeleton rounded-2xl" style={{ height: 640 }} />
        ) : members.length === 0 ? (
          <div className="rounded-2xl p-10 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
            Chưa có thành viên nào trong gia phả.
          </div>
        ) : (
          <div className="rounded-2xl p-3 sm:p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <FamilyTreeView members={members} />
          </div>
        )}
      </main>
    </div>
  )
}

export default function FamilyPage() {
  return (
    <Suspense fallback={null}>
      <FamilyContent />
    </Suspense>
  )
}
