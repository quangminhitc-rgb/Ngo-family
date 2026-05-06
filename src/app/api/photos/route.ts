import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { uploadToStorage } from '@/lib/storage'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page    = parseInt(searchParams.get('page')    ?? '1')
    const limit   = parseInt(searchParams.get('limit')   ?? '24')
    const albumId = searchParams.get('albumId')
    const skip    = (page - 1) * limit

    const where = albumId === 'none'
      ? { albumId: null }
      : albumId
      ? { albumId }
      : {}

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        orderBy: [{ takenAt: 'desc' }, { uploadedAt: 'desc' }],
        skip, take: limit,
        include: { uploadedBy: { select: { displayName: true, id: true } }, album: { select: { id: true, name: true } } },
      }),
      prisma.photo.count({ where }),
    ])

    return NextResponse.json({ photos, total, page, totalPages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const formData = await req.formData()
    const files    = formData.getAll('photos') as File[]
    const captions = formData.getAll('captions') as string[]
    const takenAts = formData.getAll('takenAts') as string[]
    const albumIds = formData.getAll('albumIds') as string[]
    const albumId  = formData.get('albumId') as string | null

    if (!files.length) return NextResponse.json({ error: 'Không có file' }, { status: 400 })

    const uploaded = []
    for (let i = 0; i < files.length; i++) {
      const file    = files[i]
      const caption = captions[i]?.trim() || null
      const takenAt = takenAts[i] ? new Date(takenAts[i]) : null
      const photoAlbumId = albumIds[i] || albumId || null

      if (!file.type.startsWith('image/')) continue
      const maxSize = parseInt(process.env.MAX_FILE_SIZE ?? '10485760')
      if (file.size > maxSize) return NextResponse.json({ error: `File "${file.name}" quá lớn` }, { status: 400 })

      const ext = path.extname(file.name).toLowerCase() || '.jpg'
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const publicUrl = await uploadToStorage('photos', filename, buffer, file.type)

      let resolvedAlbumId = photoAlbumId
      if (resolvedAlbumId) {
        const album = await prisma.album.findUnique({ where: { id: resolvedAlbumId } })
        if (!album) resolvedAlbumId = null
      }

      const photo = await prisma.photo.create({
        data: {
          filename: publicUrl,
          originalName: file.name,
          caption, size: file.size, mimeType: file.type,
          takenAt: takenAt ?? new Date(),
          userId: session.user.id,
          albumId: resolvedAlbumId,
        },
      })
      uploaded.push(photo)
    }

    return NextResponse.json({ photos: uploaded }, { status: 201 })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    console.error('[POST /api/photos]', e)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
