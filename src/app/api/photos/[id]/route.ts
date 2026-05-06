import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { deleteFromStorage } from '@/lib/storage'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const photo = await prisma.photo.findUnique({ where: { id: params.id } })
    if (!photo) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    if (session.user.role !== 'admin' && photo.userId !== session.user.id)
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })

    const { caption, takenAt, albumId } = await req.json()
    const updated = await prisma.photo.update({
      where: { id: params.id },
      data: {
        ...(caption !== undefined && { caption: caption?.trim() || null }),
        ...(takenAt !== undefined && { takenAt: takenAt ? new Date(takenAt) : null }),
        ...(albumId !== undefined && { albumId: albumId || null }),
      },
    })
    return NextResponse.json({ photo: updated })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const photo = await prisma.photo.findUnique({ where: { id: params.id } })
    if (!photo) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    if (session.user.role !== 'admin' && photo.userId !== session.user.id)
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })

    await deleteFromStorage(photo.filename)
    await prisma.photo.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
