import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const t = await prisma.eventType.findUnique({ where: { id: params.id } })
    if (!t) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    const { name, emoji, color } = await req.json()
    const updated = await prisma.eventType.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(emoji && { emoji }),
        ...(color && { color }),
      },
    })
    return NextResponse.json({ type: updated })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (e.message?.includes('Forbidden')) return NextResponse.json({ error: 'Cần quyền admin' }, { status: 403 })
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const t = await prisma.eventType.findUnique({ where: { id: params.id } })
    if (!t) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    if (t.isSystem) return NextResponse.json({ error: 'Không thể xóa loại mặc định' }, { status: 400 })
    // Chuyển events về "other"
    const otherType = await prisma.eventType.findUnique({ where: { slug: 'other' } })
    if (otherType) await prisma.event.updateMany({ where: { typeId: params.id }, data: { typeId: otherType.id } })
    await prisma.eventType.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (e.message?.includes('Forbidden')) return NextResponse.json({ error: 'Cần quyền admin' }, { status: 403 })
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
