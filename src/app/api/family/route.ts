import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { uploadToStorage } from '@/lib/storage'
import path from 'path'

export async function GET() {
  try {
    const members = await prisma.familyMember.findMany({
      orderBy: [{ generation: 'asc' }, { orderInGen: 'asc' }],
    })
    return NextResponse.json({ members })
  } catch {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    // Always parse as FormData (browser auto-sets correct Content-Type with boundary)
    const formData = await req.formData()
    const get = (k: string) => (formData.get(k) as string | null) ?? ''

    const data: any = {}
    data.name = get('name').trim()
    if (!data.name) return NextResponse.json({ error: 'Thiếu tên' }, { status: 400 })

    data.nickname = get('nickname').trim() || null
    data.gender = get('gender') || 'other'
    data.birthDate = get('birthDate') || null
    data.isLunarBirth = get('isLunarBirth') === 'true'
    data.deathDate = get('deathDate') || null
    data.isLunarDeath = get('isLunarDeath') === 'true'
    data.bio = get('bio').trim() || null
    data.fatherId = get('fatherId') || null
    data.motherId = get('motherId') || null
    data.generation = parseInt(get('generation') || '1')
    data.orderInGen = parseInt(get('orderInGen') || '0')

    const spouseIdsRaw = get('spouseIds')
    try { data.spouseIds = JSON.stringify(JSON.parse(spouseIdsRaw)) }
    catch { data.spouseIds = '[]' }

    // Photo upload (optional)
    const file = formData.get('photo') as File | null
    if (file && file.size > 0 && file.type.startsWith('image/')) {
      const ext = path.extname(file.name) || '.jpg'
      const filename = `member-${Date.now()}${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      data.photoUrl = await uploadToStorage('members', filename, buffer, file.type)
    }

    const member = await prisma.familyMember.create({ data })
    return NextResponse.json({ member }, { status: 201 })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (e.message?.includes('Forbidden')) return NextResponse.json({ error: 'Cần quyền admin' }, { status: 403 })
    console.error('[POST /api/family]', e)
    return NextResponse.json({ error: 'Lỗi server: ' + (e.message ?? '') }, { status: 500 })
  }
}
