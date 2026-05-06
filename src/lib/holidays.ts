/**
 * Ngày lễ, nghỉ lễ theo quy định nhà nước Việt Nam
 * Bộ luật Lao động 2019 – Điều 112
 *
 * Ngày nghỉ lễ, tết:
 *  1. Tết Dương lịch             : 1/1 dương
 *  2. Tết Nguyên Đán             : 5 ngày (1 cuối năm âm + 4 đầu năm âm)
 *  3. Giỗ Tổ Hùng Vương          : 10/3 âm lịch
 *  4. Ngày Giải phóng miền Nam   : 30/4 dương
 *  5. Ngày Quốc tế Lao động      : 1/5 dương
 *  6. Ngày Quốc khánh            : 2/9 dương (2 ngày: 2/9 và 3/9)
 */

import { lunarToSolar } from './lunar'

export interface Holiday {
  /** key dạng "YYYY-MM-DD" để map nhanh */
  key: string
  date: Date
  title: string
  description: string
  emoji: string
  color: string
}

const RED   = '#e05252'   // đỏ – ngày lễ chính thức
const GOLD  = '#c9a84c'   // vàng – Tết Nguyên Đán

/** Tạo key "YYYY-MM-DD" từ Date */
function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Tạo Holiday object từ năm/tháng/ngày dương lịch */
function solarHoliday(
  year: number, month: number, day: number,
  title: string, description: string, emoji: string, color = RED
): Holiday | null {
  const date = new Date(year, month - 1, day)
  return { key: toKey(date), date, title, description, emoji, color }
}

/** Tạo Holiday object từ ngày âm lịch, chuyển sang dương */
function lunarHoliday(
  lunarDay: number, lunarMonth: number, lunarYear: number,
  title: string, description: string, emoji: string, color = RED
): Holiday | null {
  const solar = lunarToSolar(lunarDay, lunarMonth, lunarYear)
  if (!solar || solar.day === 0) return null
  const date = new Date(solar.year, solar.month - 1, solar.day)
  return { key: toKey(date), date, title, description, emoji, color }
}

/**
 * Trả về danh sách ngày lễ nhà nước Việt Nam cho năm `year` (dương lịch)
 */
export function getHolidaysForYear(year: number): Holiday[] {
  const holidays: Holiday[] = []

  const add = (h: Holiday | null) => { if (h) holidays.push(h) }

  // ── 1. Tết Dương lịch ─────────────────────────────────────
  add(solarHoliday(year, 1, 1,
    'Tết Dương lịch', 'Năm mới dương lịch', '🎉'))

  // ── 2. Tết Nguyên Đán ─────────────────────────────────────
  // 5 ngày nghỉ: 1 ngày cuối năm âm + mùng 1, 2, 3, 4 tháng 1 âm
  // "1 ngày cuối năm âm" = ngày 30/12 âm (hoặc 29/12 nếu tháng 12 âm có 29 ngày)

  // Tìm ngày cuối tháng 12 âm của năm trước: thử 30, nếu không có thì 29
  const tet30 = lunarToSolar(30, 12, year - 1)
  const tet29 = lunarToSolar(29, 12, year - 1)

  // Kiểm tra xem ngày 30 âm chuyển sang dương có đúng năm không
  const eveDay = (tet30 && tet30.year === year)
    ? tet30
    : (tet29 && tet29.year === year ? tet29 : tet30)

  if (eveDay) {
    const eveDate = new Date(eveDay.year, eveDay.month - 1, eveDay.day)
    holidays.push({
      key: toKey(eveDate),
      date: eveDate,
      title: 'Giao thừa Tết Nguyên Đán',
      description: `${eveDay.day === 30 ? '30' : '29'} tháng 12 Âm lịch — đêm giao thừa`,
      emoji: '🏮',
      color: GOLD,
    })
  }

  // Mùng 1 → Mùng 4
  const tetLabels: Record<number, string> = {
    1: 'Mùng 1 Tết — Mồng Một',
    2: 'Mùng 2 Tết — Mồng Hai',
    3: 'Mùng 3 Tết — Mồng Ba',
    4: 'Mùng 4 Tết — Mồng Bốn',
  }
  for (let mung = 1; mung <= 4; mung++) {
    add(lunarHoliday(mung, 1, year,
      mung === 1 ? 'Tết Nguyên Đán' : `Tết Nguyên Đán (Mùng ${mung})`,
      tetLabels[mung],
      '🏮', GOLD))
  }

  // ── 3. Giỗ Tổ Hùng Vương ──────────────────────────────────
  add(lunarHoliday(10, 3, year,
    'Giỗ Tổ Hùng Vương',
    '10 tháng 3 Âm lịch — Kỷ niệm Hùng Vương dựng nước',
    '🏯', RED))

  // ── 4. Ngày Giải phóng miền Nam ───────────────────────────
  add(solarHoliday(year, 4, 30,
    'Ngày Giải phóng miền Nam',
    'Thống nhất đất nước 30/4/1975',
    '🎌'))

  // ── 5. Ngày Quốc tế Lao động ──────────────────────────────
  add(solarHoliday(year, 5, 1,
    'Ngày Quốc tế Lao động',
    'International Workers\' Day — 1/5',
    '✊'))

  // ── 6. Ngày Quốc khánh (2 ngày từ 2022 trở đi) ───────────
  add(solarHoliday(year, 9, 2,
    'Ngày Quốc khánh',
    'Tuyên ngôn Độc lập 2/9/1945',
    '🇻🇳'))
  if (year >= 2022) {
    add(solarHoliday(year, 9, 3,
      'Nghỉ bù Quốc khánh',
      'Ngày nghỉ bù Quốc khánh 2/9',
      '🇻🇳'))
  }

  return holidays
}

/**
 * Chuyển danh sách holiday → Map theo key "YYYY-MM-DD"
 * để tra cứu nhanh trong calendar
 */
export function buildHolidayMap(year: number): Map<string, Holiday[]> {
  const map = new Map<string, Holiday[]>()
  for (const h of getHolidaysForYear(year)) {
    if (!map.has(h.key)) map.set(h.key, [])
    map.get(h.key)!.push(h)
  }
  return map
}
