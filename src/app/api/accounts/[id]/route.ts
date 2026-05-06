/**
 * API Route: /api/accounts/[id]
 * PATCH  - Cập nhật tài khoản (chỉ admin)
 * DELETE - Xóa tài khoản (chỉ admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// PATCH: Cập nhật thông tin tài khoản
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireAdmin()

    const { displayName, password, role } = await request.json()

    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) {
      return NextResponse.json({ error: 'Tài khoản không tồn tại' }, { status: 404 })
    }

    // Không cho xóa/sửa role của chính mình
    if (params.id === adminSession.user.id && role && role !== adminSession.user.role) {
      return NextResponse.json({ error: 'Không thể thay đổi role của chính mình' }, { status: 400 })
    }

    const updateData: any = {}
    if (displayName) updateData.displayName = displayName.trim()
    if (role) updateData.role = role === 'admin' ? 'admin' : 'member'
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 })
      }
      updateData.password = await bcrypt.hash(password, 12)
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    if (error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: 'Chỉ admin mới có quyền' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

// DELETE: Xóa tài khoản
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireAdmin()

    // Không cho xóa chính mình
    if (params.id === adminSession.user.id) {
      return NextResponse.json({ error: 'Không thể xóa tài khoản của chính mình' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) {
      return NextResponse.json({ error: 'Tài khoản không tồn tại' }, { status: 404 })
    }

    await prisma.user.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    if (error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: 'Chỉ admin mới có quyền' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
