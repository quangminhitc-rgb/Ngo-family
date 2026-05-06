import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  const types = await prisma.eventType.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json({ types })
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { name, emoji, color } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Thiếu tên' }, { status: 400 })
    const slug = name.trim().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
    const exists = await prisma.eventType.findUnique({ where: { slug } })
    if (exists) return NextResponse.json({ error: 'Loại này đã tồn tại' }, { status: 409 })
    const t = await prisma.eventType.create({
      data: { slug, name: name.trim(), emoji: emoji || '📌', color: color || '#7c7ccc', isSystem: false, sortOrder: 99 },
    })
    return NextResponse.json({ type: t }, { status: 201 })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (e.message?.includes('Forbidden')) return NextResponse.json({ error: 'Cần quyền admin' }, { status: 403 })
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
