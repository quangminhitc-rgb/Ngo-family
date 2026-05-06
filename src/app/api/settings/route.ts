import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  const rows = await prisma.siteSetting.findMany()
  const settings: Record<string, string> = {}
  for (const r of rows) settings[r.key] = r.value
  return NextResponse.json({ settings })
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      // Upload background image
      const formData = await req.formData()
      const file = formData.get('background') as File | null
      if (!file) return NextResponse.json({ error: 'Thiếu file' }, { status: 400 })
      if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Chỉ chấp nhận ảnh' }, { status: 400 })

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true })

      const ext = path.extname(file.name) || '.jpg'
      const filename = `bg-${Date.now()}${ext}`
      await writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()))

      await prisma.siteSetting.upsert({
        where: { key: 'home_background' },
        update: { value: `/uploads/${filename}` },
        create: { key: 'home_background', value: `/uploads/${filename}` },
      })
      return NextResponse.json({ url: `/uploads/${filename}` })
    } else {
      // JSON settings update
      const body = await req.json()
      const results: Record<string, string> = {}
      for (const [key, value] of Object.entries(body)) {
        const val = String(value)
        await prisma.siteSetting.upsert({
          where: { key },
          update: { value: val },
          create: { key, value: val },
        })
        results[key] = val
      }
      return NextResponse.json({ settings: results })
    }
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (e.message?.includes('Forbidden')) return NextResponse.json({ error: 'Cần quyền admin' }, { status: 403 })
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
