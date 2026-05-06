/**
 * API Route: /api/accounts
 * GET  - Lấy danh sách tài khoản (chỉ admin)
 * POST - Tạo tài khoản mới (chỉ admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// GET: Lấy danh sách accounts
export async function GET() {
  try {
    await requireAdmin()

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        createdAt: true,
        _count: { select: { photos: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ users })
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

// POST: Tạo tài khoản mới
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const { username, password, displayName, role } = await request.json()

    if (!username || !password || !displayName) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
    }

    // Kiểm tra username đã tồn tại chưa
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Username đã tồn tại' }, { status: 409 })
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        username: username.trim().toLowerCase(),
        password: hashedPassword,
        displayName: displayName.trim(),
        role: role === 'admin' ? 'admin' : 'member',
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }
    if (error.message?.includes('Forbidden')) {
      return NextResponse.json({ error: 'Chỉ admin mới có quyền' }, { status: 403 })
    }
    console.error('POST /api/accounts error:', error)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
