import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { lunarToSolar } from '@/lib/lunar'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const year = parseInt(searchParams.get('year') ?? new Date().getFullYear().toString())

    const events = await prisma.event.findMany({
      where: {
        OR: [
          { date: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
          { isRecurring: true },
        ],
      },
      orderBy: { date: 'asc' },
      include: { eventType: true },
    })

    const processed = events.map(event => {
      let date = new Date(event.date)
      if (event.isRecurring) date.setFullYear(year)
      // Nếu là ngày âm lịch, convert sang dương
      if (event.isLunar) {
        const solar = lunarToSolar(date.getDate(), date.getMonth() + 1, year)
        if (solar) date = new Date(solar.year, solar.month - 1, solar.day)
      }
      return { ...event, date }
    })

    const seen = new Set<string>()
    const dedup = processed.filter(e => {
      if (seen.has(e.id)) return false
      seen.add(e.id)
      return true
    })

    return NextResponse.json({ events: dedup })
  } catch {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { title, description, date, typeId, isRecurring, isLunar } = await req.json()
    if (!title || !date || !typeId) return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })

    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        date: new Date(date),
        typeId,
        isRecurring: isRecurring ?? false,
        isLunar: isLunar ?? false,
      },
      include: { eventType: true },
    })
    return NextResponse.json({ event }, { status: 201 })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (e.message?.includes('Forbidden')) return NextResponse.json({ error: 'Cần quyền admin' }, { status: 403 })
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
