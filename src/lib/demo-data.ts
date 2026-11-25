/**
 * Dữ liệu demo để xem thử giao diện beta mà KHÔNG cần database.
 * Dùng bằng cách thêm ?demo=1 vào URL của trang /family và /album/beta.
 */
import type { FamilyMember } from '@/components/family/FamilyTree'

function m(
  id: string,
  name: string,
  gender: 'male' | 'female',
  generation: number,
  orderInGen: number,
  extra: Partial<FamilyMember> = {},
): FamilyMember {
  return {
    id,
    name,
    nickname: null,
    gender,
    birthDate: null,
    isLunarBirth: false,
    deathDate: null,
    isLunarDeath: false,
    bio: null,
    photoUrl: null,
    generation,
    orderInGen,
    fatherId: null,
    motherId: null,
    spouseIds: '[]',
    ...extra,
  }
}

const sp = (...ids: string[]) => JSON.stringify(ids)

export const DEMO_MEMBERS: FamilyMember[] = [
  // Đời 1
  m('o1', 'Ngô Văn Tổ', 'male', 1, 0, { birthDate: '1925-03-02', deathDate: '2001-09-14', spouseIds: sp('o2'), bio: 'Ông tổ của dòng họ.' }),
  m('o2', 'Trần Thị Mận', 'female', 1, 1, { birthDate: '1929-07-20', deathDate: '2010-01-05', spouseIds: sp('o1') }),
  // Đời 2
  m('p1', 'Ngô Văn Hải', 'male', 2, 0, { birthDate: '1952-05-10', fatherId: 'o1', motherId: 'o2', spouseIds: sp('p2'), nickname: 'Bác Hai' }),
  m('p2', 'Lê Thị Hoa', 'female', 2, 1, { birthDate: '1955-11-23', spouseIds: sp('p1') }),
  m('p3', 'Ngô Văn Sơn', 'male', 2, 2, { birthDate: '1957-02-17', fatherId: 'o1', motherId: 'o2', spouseIds: sp('p4') }),
  m('p4', 'Phạm Thị Lan', 'female', 2, 3, { birthDate: '1960-08-08', spouseIds: sp('p3') }),
  m('p5', 'Ngô Thị Thảo', 'female', 2, 4, { birthDate: '1963-12-01', fatherId: 'o1', motherId: 'o2' }),
  // Đời 3
  m('c1', 'Ngô Quang Minh', 'male', 3, 0, { birthDate: '1985-04-12', fatherId: 'p1', motherId: 'p2', spouseIds: sp('c2'), nickname: 'Minh' }),
  m('c2', 'Võ Thị Ngọc', 'female', 3, 1, { birthDate: '1987-09-30', spouseIds: sp('c1') }),
  m('c3', 'Ngô Thị Mai', 'female', 3, 2, { birthDate: '1988-06-06', fatherId: 'p1', motherId: 'p2' }),
  m('c4', 'Ngô Văn Dũng', 'male', 3, 3, { birthDate: '1984-01-25', fatherId: 'p3', motherId: 'p4', spouseIds: sp('c5') }),
  m('c5', 'Đặng Thị Yến', 'female', 3, 4, { birthDate: '1986-03-14', spouseIds: sp('c4') }),
  m('c6', 'Ngô Thị Linh', 'female', 3, 5, { birthDate: '1990-10-10', fatherId: 'p3', motherId: 'p4' }),
  // Đời 4
  m('d1', 'Ngô Gia Bảo', 'male', 4, 0, { birthDate: '2012-08-19', fatherId: 'c1', motherId: 'c2' }),
  m('d2', 'Ngô Bảo Châu', 'female', 4, 1, { birthDate: '2016-02-11', fatherId: 'c1', motherId: 'c2' }),
  m('d3', 'Ngô Minh Khôi', 'male', 4, 2, { birthDate: '2014-05-05', fatherId: 'c4', motherId: 'c5' }),
]

/** Cây lớn (~77 người, 5 đời) để thử thu gọn nhánh và hiệu năng. Dùng ?demo=big */
export function makeBigDemo(): FamilyMember[] {
  const out: FamilyMember[] = []
  const FAM = ['Văn', 'Đức', 'Quang', 'Minh', 'Hữu', 'Gia', 'Thanh', 'Bảo']
  const GIVEN_M = ['Hải', 'Sơn', 'Dũng', 'Long', 'Phúc', 'Khôi', 'Nam', 'Tuấn', 'Hưng', 'Kiên']
  const GIVEN_F = ['Hoa', 'Lan', 'Mai', 'Linh', 'Thảo', 'Yến', 'Ngọc', 'Trang', 'Hà', 'Châu']
  let n = 0
  const nm = (g: 'male' | 'female') =>
    `${g === 'male' ? 'Ngô' : 'Lê'} ${FAM[n % FAM.length]} ${(g === 'male' ? GIVEN_M : GIVEN_F)[(n * 3) % 10]}`
  const add = (gen: number, order: number, g: 'male' | 'female', extra: Partial<FamilyMember>) => {
    const id = `b${++n}`
    out.push(m(id, nm(g), g, gen, order, { birthDate: `${1900 + gen * 25 + (n % 9)}-0${1 + (n % 9)}-1${n % 9}`, ...extra }))
    return id
  }
  // Mỗi cặp có 3 con (2 trai kết hôn + 1 gái) cho tới đời 5 → khoảng 77 người
  const grow = (fatherId: string, motherId: string, gen: number) => {
    if (gen > 5) return
    for (let i = 0; i < 3; i++) {
      const g: 'male' | 'female' = i === 1 ? 'female' : 'male'
      const cid = add(gen, i, g, { fatherId, motherId })
      if (g === 'male') {
        const sid = add(gen, i, 'female', { spouseIds: sp(cid) })
        out.find(x => x.id === cid)!.spouseIds = sp(sid)
        grow(cid, sid, gen + 1)
      }
    }
  }
  const a = add(1, 0, 'male', {})
  const b = add(1, 1, 'female', { spouseIds: sp(a) })
  out.find(x => x.id === a)!.spouseIds = sp(b)
  grow(a, b, 2)
  return out
}

// ── Ảnh demo: sinh SVG gradient với nhiều tỉ lệ khác nhau ───────────
export interface DemoPhoto {
  id: string
  src: string
  width: number
  height: number
  caption: string
  albumId: string
}

const SIZES: [number, number][] = [
  [1600, 1067], [1067, 1600], [1600, 900], [1200, 1200], [1600, 1200], [900, 1600],
]
const HUES = [18, 42, 160, 200, 260, 320, 350, 90]

function svgDataUrl(w: number, h: number, hue: number, label: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue},55%,45%)"/><stop offset="1" stop-color="hsl(${(hue + 50) % 360},60%,25%)"/>` +
    `</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>` +
    `<text x="50%" y="50%" fill="rgba(255,255,255,0.85)" font-family="sans-serif" font-size="${Math.round(w / 12)}" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const DEMO_ALBUMS = [
  { id: 'a1', name: 'Tết 2026' },
  { id: 'a2', name: 'Du lịch Đà Nẵng' },
  { id: 'a3', name: 'Họp mặt dòng họ' },
]

export const DEMO_PHOTOS: DemoPhoto[] = Array.from({ length: 36 }).map((_, i) => {
  const [w, h] = SIZES[i % SIZES.length]
  const album = DEMO_ALBUMS[i % DEMO_ALBUMS.length]
  return {
    id: `demo-${i}`,
    src: svgDataUrl(w, h, HUES[i % HUES.length], `Ảnh ${i + 1}`),
    width: w,
    height: h,
    caption: `${album.name} – ảnh ${i + 1}`,
    albumId: album.id,
  }
})
