import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireAdmin } from '@/lib/auth'

// GET: Danh sách album (public)
export async function GET() {
  try {
    const albums = await prisma.album.findMany({
      orderBy: [{ isDefault: 'desc' }, { displayDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        createdBy: { select: { displayName: true } },
        _count: { select: { photos: true } },
        photos: { take: 1, orderBy: { uploadedAt: 'desc' }, select: { filename: true } },
      },
    })
    return NextResponse.json({ albums })
  } catch (e) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

// POST: Tạo album mới (admin)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const session = await requireAuth()
    const { name, description, displayDate } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Thiếu tên album' }, { status: 400 })

    const album = await prisma.album.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        displayDate: displayDate ? new Date(displayDate) : null,
        userId: session.user.id,
      },
    })
    return NextResponse.json({ album }, { status: 201 })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (e.message?.includes('Forbidden')) return NextResponse.json({ error: 'Cần quyền admin' }, { status: 403 })
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
