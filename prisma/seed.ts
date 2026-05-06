import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seed database...')

  // ── Users ────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: await bcrypt.hash('admin123', 12),
      displayName: 'Quản trị viên',
      role: 'admin',
    },
  })
  console.log(`✅ Admin: ${admin.username}`)

  const member = await prisma.user.upsert({
    where: { username: 'member' },
    update: {},
    create: {
      username: 'member',
      password: await bcrypt.hash('member123', 12),
      displayName: 'Thành viên',
      role: 'member',
    },
  })
  console.log(`✅ Member: ${member.username}`)

  // ── Default Album "Ảnh riêng lẻ" ────────────────────────
  await prisma.album.upsert({
    where: { id: 'default-album' },
    update: {},
    create: {
      id: 'default-album',
      name: 'Ảnh riêng lẻ',
      description: 'Ảnh chưa được xếp vào album nào',
      isDefault: true,
      userId: admin.id,
    },
  })
  console.log(`✅ Default album created`)

  // ── Event Types ──────────────────────────────────────────
  const eventTypes = [
    { slug: 'birthday',    name: 'Sinh nhật',    emoji: '🎂', color: '#52a852', isSystem: true, sortOrder: 1 },
    { slug: 'anniversary', name: 'Kỷ niệm',      emoji: '❤️', color: '#e05252', isSystem: true, sortOrder: 2 },
    { slug: 'reunion',     name: 'Họp mặt',      emoji: '👨‍👩‍👧‍👦', color: '#c9a84c', isSystem: true, sortOrder: 3 },
    { slug: 'other',       name: 'Sự kiện khác', emoji: '📌', color: '#7c7ccc', isSystem: true, sortOrder: 4 },
  ]
  for (const et of eventTypes) {
    await prisma.eventType.upsert({ where: { slug: et.slug }, update: {}, create: et })
    console.log(`✅ EventType: ${et.emoji} ${et.name}`)
  }

  // ── Sample Events ────────────────────────────────────────
  const birthday    = await prisma.eventType.findUnique({ where: { slug: 'birthday' } })
  const reunion     = await prisma.eventType.findUnique({ where: { slug: 'reunion' } })
  const anniversary = await prisma.eventType.findUnique({ where: { slug: 'anniversary' } })
  const yr = new Date().getFullYear()

  const sampleEvents = [
    { title: 'Tết Nguyên Đán',    date: new Date(`${yr}-02-01`), typeId: reunion!.id,     isRecurring: true },
    { title: 'Sinh nhật Ba',      date: new Date(`${yr}-03-15`), typeId: birthday!.id,    isRecurring: true },
    { title: 'Kỷ niệm ngày cưới', date: new Date(`${yr}-06-20`), typeId: anniversary!.id, isRecurring: true },
    { title: 'Sinh nhật Mẹ',      date: new Date(`${yr}-08-10`), typeId: birthday!.id,    isRecurring: true },
    { title: 'Họp mặt cuối năm',  date: new Date(`${yr}-12-28`), typeId: reunion!.id,     isRecurring: true },
  ]
  for (const ev of sampleEvents) {
    await prisma.event.create({ data: ev })
    console.log(`📅 ${ev.title}`)
  }

  console.log('\n🎉 Seed xong! Admin: admin/admin123 | Member: member/member123')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
