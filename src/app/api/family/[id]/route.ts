import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { uploadToStorage } from '@/lib/storage'
import path from 'path'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const contentType = req.headers.get('content-type') ?? ''

    let updateData: any = {}

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const get = (k: string) => (formData.get(k) as string | null) ?? ''

      const name = get('name')
      if (name) updateData.name = name.trim()

      const nickname = get('nickname')
      updateData.nickname = nickname.trim() || null

      const gender = get('gender')
      if (gender) updateData.gender = gender

      const birthDate = get('birthDate')
      updateData.birthDate = birthDate || null
      updateData.isLunarBirth = get('isLunarBirth') === 'true'

      const deathDate = get('deathDate')
      updateData.deathDate = deathDate || null
      updateData.isLunarDeath = get('isLunarDeath') === 'true'

      const bio = get('bio')
      updateData.bio = bio.trim() || null

      const fatherId = get('fatherId')
      updateData.fatherId = fatherId || null

      const motherId = get('motherId')
      updateData.motherId = motherId || null

      const spouseIdsRaw = get('spouseIds')
      if (spouseIdsRaw) {
        try { updateData.spouseIds = JSON.stringify(JSON.parse(spouseIdsRaw)) }
        catch { updateData.spouseIds = '[]' }
      }

      const generation = get('generation')
      if (generation) updateData.generation = parseInt(generation)
      const orderInGen = get('orderInGen')
      if (orderInGen !== '') updateData.orderInGen = parseInt(orderInGen)

      // Photo file
      const file = formData.get('photo') as File | null
      if (file && file.size > 0 && file.type.startsWith('image/')) {
        const ext = path.extname(file.name) || '.jpg'
        const filename = `member-${params.id}-${Date.now()}${ext}`
        const buffer = Buffer.from(await file.arrayBuffer())
        updateData.photoUrl = await uploadToStorage('members', filename, buffer)
      }
    } else {
      const body = await req.json()
      const { name, nickname, gender, birthDate, isLunarBirth, deathDate, isLunarDeath, bio, fatherId, motherId, spouseIds, generation, orderInGen } = body
      if (name) updateData.name = name.trim()
      if (nickname !== undefined) updateData.nickname = nickname?.trim() || null
      if (gender) updateData.gender = gender
      if (birthDate !== undefined) updateData.birthDate = birthDate || null
      if (isLunarBirth !== undefined) updateData.isLunarBirth = isLunarBirth
      if (deathDate !== undefined) updateData.deathDate = deathDate || null
      if (isLunarDeath !== undefined) updateData.isLunarDeath = isLunarDeath
      if (bio !== undefined) updateData.bio = bio?.trim() || null
      if (fatherId !== undefined) updateData.fatherId = fatherId || null
      if (motherId !== undefined) updateData.motherId = motherId || null
      if (spouseIds !== undefined) updateData.spouseIds = JSON.stringify(spouseIds)
      if (generation !== undefined) updateData.generation = generation
      if (orderInGen !== undefined) updateData.orderInGen = orderInGen
    }

    // Fetch old spouseIds before update so we can diff for bidirectional sync
    const currentMember = updateData.spouseIds !== undefined
      ? await prisma.familyMember.findUnique({ where: { id: params.id }, select: { spouseIds: true } })
      : null

    const member = await prisma.familyMember.update({ where: { id: params.id }, data: updateData })

    // Bidirectional spouse sync
    if (updateData.spouseIds !== undefined) {
      const oldSpouseIds: string[] = (() => { try { return JSON.parse(currentMember?.spouseIds ?? '[]') } catch { return [] } })()
      const newSpouseIds: string[] = (() => { try { return JSON.parse(updateData.spouseIds) } catch { return [] } })()
      const added   = newSpouseIds.filter(id => !oldSpouseIds.includes(id))
      const removed = oldSpouseIds.filter(id => !newSpouseIds.includes(id))
      await Promise.all([
        ...added.map(async (spouseId) => {
          const spouse = await prisma.familyMember.findUnique({ where: { id: spouseId } })
          if (!spouse) return
          const spIds: string[] = (() => { try { return JSON.parse(spouse.spouseIds) } catch { return [] } })()
          if (!spIds.includes(params.id)) {
            await prisma.familyMember.update({
              where: { id: spouseId },
              data: { spouseIds: JSON.stringify([...spIds, params.id]) },
            })
          }
        }),
        ...removed.map(async (spouseId) => {
          const spouse = await prisma.familyMember.findUnique({ where: { id: spouseId } })
          if (!spouse) return
          const spIds: string[] = (() => { try { return JSON.parse(spouse.spouseIds) } catch { return [] } })()
          if (spIds.includes(params.id)) {
            await prisma.familyMember.update({
              where: { id: spouseId },
              data: { spouseIds: JSON.stringify(spIds.filter(id => id !== params.id)) },
            })
          }
        }),
      ])
    }

    return NextResponse.json({ member })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (e.message?.includes('Forbidden')) return NextResponse.json({ error: 'Cần quyền admin' }, { status: 403 })
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    await prisma.familyMember.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    if (e.message === 'Unauthorized') return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    if (e.message?.includes('Forbidden')) return NextResponse.json({ error: 'Cần quyền admin' }, { status: 403 })
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
