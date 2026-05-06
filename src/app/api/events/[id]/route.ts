import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const body = await req.json()
    const event = await prisma.event.findUnique({ where: { id: params.id } })
    if (!event) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })

    const updated = await prisma.event.update({
      where: { id: params.id },
      data: {
        ...(body.title && { title: body.title.trim() }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.date && { date: new Date(body.date) }),
        ...(body.typeId && { typeId: body.typeId }),
        ...(body.isRecurring !== undefined && { isRecurring: body.isRecurring }),
        ...(body.isLunar !== undefined && { isLunar: body.isLunar }),
      },
      include: { eventType: true },
    })
    return NextResponse.json({ event: updated })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (e.message?.includes('Forbidden')) return NextResponse.json({ error: 'Cần quyền admin' }, { status: 403 })
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    await prisma.event.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (e.message?.includes('Forbidden')) return NextResponse.json({ error: 'Cần quyền admin' }, { status: 403 })
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
