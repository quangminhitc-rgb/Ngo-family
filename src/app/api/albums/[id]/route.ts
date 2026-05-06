import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// PATCH: Cập nhật album
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const album = await prisma.album.findUnique({ where: { id: params.id } })
    if (!album) return NextResponse.json({ error: 'Album không tồn tại' }, { status: 404 })
    if (album.isDefault) return NextResponse.json({ error: 'Không thể sửa album mặc định' }, { status: 400 })

    const { name, description, displayDate, coverPhotoId, userId } = await req.json()
    const updated = await prisma.album.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(displayDate !== undefined && { displayDate: displayDate ? new Date(displayDate) : null }),
        ...(coverPhotoId !== undefined && { coverPhotoId }),
        ...(userId && { userId }),
      },
    })
    return NextResponse.json({ album: updated })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (e.message?.includes('Forbidden')) return NextResponse.json({ error: 'Cần quyền admin' }, { status: 403 })
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

// DELETE: Xóa album
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const album = await prisma.album.findUnique({ where: { id: params.id } })
    if (!album) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })
    if (album.isDefault) return NextResponse.json({ error: 'Không thể xóa album mặc định' }, { status: 400 })
    // Ảnh trong album → chuyển về null (không thuộc album nào)
    await prisma.photo.updateMany({ where: { albumId: params.id }, data: { albumId: null } })
    await prisma.album.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (e.message?.includes('Forbidden')) return NextResponse.json({ error: 'Cần quyền admin' }, { status: 403 })
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
