/**
 * family-layout.ts — bố cục cây gia phả dạng "trên xuống dưới".
 *
 * Ý tưởng:
 *  - Mỗi cặp vợ/chồng (hoặc 1 người độc thân) gộp thành một "unit" nằm trên một hàng.
 *  - Con cái treo dưới unit của cha mẹ, nối bằng đường vuông góc (thân dọc → thanh ngang → nhánh dọc).
 *  - Cha/mẹ luôn nằm giữa khối con của mình.
 *  - Nhánh có thể thu gọn: thay các unit con bằng một ô "N người".
 *
 * Mô hình dữ liệu dùng chung với phần còn lại của dự án (FamilyMember: fatherId, motherId, spouseIds).
 */

import type { FamilyMember } from '@/components/family/FamilyTree'

// ── Kích thước (px, theo hệ toạ độ của cây) ─────────────────────
export const CARD_W = 196
export const CARD_H = 76
export const SPOUSE_GAP = 16
export const H_GAP = 28
export const V_GAP = 88
const PAD_X = 40
const PAD_Y = 40
export const LABEL_W = 60 // chỗ cho nhãn "Đời N" bên trái

// ── Mô hình ─────────────────────────────────────────────────────
export interface Unit {
  id: string
  members: FamilyMember[] // members[0] là người "gốc" (huyết thống), phần còn lại là vợ/chồng
  primary: FamilyMember
}

export interface FamilyModel {
  units: Map<string, Unit>
  unitOfMember: Map<string, string>
  parentUnit: Map<string, string> // unitId → unitId của cha/mẹ
  childUnits: Map<string, string[]>
  roots: string[]
  byId: Map<string, FamilyMember>
  total: number
}

function parseSpouseIds(raw: string): string[] {
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}

const byOrder = (a: FamilyMember, b: FamilyMember) =>
  a.generation - b.generation || a.orderInGen - b.orderInGen || a.name.localeCompare(b.name, 'vi')

export function buildModel(members: FamilyMember[]): FamilyModel {
  const byId = new Map(members.map(m => [m.id, m]))

  // 1. Đồ thị vợ/chồng (đối xứng)
  const adj = new Map<string, Set<string>>()
  members.forEach(m => adj.set(m.id, new Set()))
  members.forEach(m => {
    parseSpouseIds(m.spouseIds).forEach(s => {
      if (s !== m.id && byId.has(s)) {
        adj.get(m.id)!.add(s)
        adj.get(s)!.add(m.id)
      }
    })
  })

  const hasParents = (m: FamilyMember) =>
    (!!m.fatherId && byId.has(m.fatherId)) || (!!m.motherId && byId.has(m.motherId))

  // 2. Gom thành các thành phần liên thông → unit
  const units = new Map<string, Unit>()
  const unitOfMember = new Map<string, string>()
  const seen = new Set<string>()
  for (const m of [...members].sort(byOrder)) {
    if (seen.has(m.id)) continue
    const comp: FamilyMember[] = []
    const stack = [m.id]
    seen.add(m.id)
    while (stack.length) {
      const id = stack.pop()!
      comp.push(byId.get(id)!)
      adj.get(id)!.forEach(n => {
        if (!seen.has(n)) {
          seen.add(n)
          stack.push(n)
        }
      })
    }
    // Người gốc: ưu tiên người có cha/mẹ trong dữ liệu (huyết thống), rồi nam, rồi theo đời/thứ tự
    comp.sort((a, b) => {
      const ha = hasParents(a) ? 0 : 1
      const hb = hasParents(b) ? 0 : 1
      if (ha !== hb) return ha - hb
      if (ha === 1) {
        const ga = a.gender === 'male' ? 0 : 1
        const gb = b.gender === 'male' ? 0 : 1
        if (ga !== gb) return ga - gb
      }
      return byOrder(a, b)
    })
    const unit: Unit = { id: comp[0].id, members: comp, primary: comp[0] }
    units.set(unit.id, unit)
    comp.forEach(x => unitOfMember.set(x.id, unit.id))
  }

  // 3. Quan hệ cha mẹ → con (chỉ gắn theo người gốc của unit)
  const parentUnit = new Map<string, string>()
  const childUnits = new Map<string, string[]>()
  units.forEach(u => childUnits.set(u.id, []))
  units.forEach(u => {
    const p = u.primary
    const fu = p.fatherId ? unitOfMember.get(p.fatherId) : undefined
    const mu = p.motherId ? unitOfMember.get(p.motherId) : undefined
    const pu = fu ?? mu
    if (pu && pu !== u.id) {
      parentUnit.set(u.id, pu)
      childUnits.get(pu)!.push(u.id)
    }
  })
  childUnits.forEach(list =>
    list.sort((a, b) => byOrder(units.get(a)!.primary, units.get(b)!.primary)),
  )

  // 4. Gốc cây
  let roots = Array.from(units.keys()).filter(id => !parentUnit.has(id))
  roots.sort((a, b) => byOrder(units.get(a)!.primary, units.get(b)!.primary))
  if (roots.length === 0 && units.size > 0) {
    // dữ liệu vòng tròn → lấy người đời nhỏ nhất làm gốc
    roots = [Array.from(units.values()).sort((a, b) => byOrder(a.primary, b.primary))[0].id]
  }

  return { units, unitOfMember, parentUnit, childUnits, roots, byId, total: members.length }
}

/** Chuỗi unit từ gốc tới `unitId` (bao gồm cả `unitId`). */
export function ancestorChain(model: FamilyModel, unitId: string): string[] {
  const chain: string[] = []
  const seen = new Set<string>()
  let cur: string | undefined = unitId
  while (cur && !seen.has(cur)) {
    seen.add(cur)
    chain.unshift(cur)
    cur = model.parentUnit.get(cur)
  }
  return chain
}

/** Số người (tính cả vợ/chồng) trong các nhánh con của unit. */
export function countDescendants(model: FamilyModel, unitId: string, seen = new Set<string>()): number {
  let n = 0
  for (const c of model.childUnits.get(unitId) ?? []) {
    if (seen.has(c)) continue
    seen.add(c)
    n += model.units.get(c)!.members.length + countDescendants(model, c, seen)
  }
  return n
}

// ── Layout ──────────────────────────────────────────────────────
export interface LayoutNode {
  unit: Unit
  depth: number
  cx: number // tâm theo trục X của cả unit
  y: number
  width: number
  cardXs: number[] // toạ độ X (cạnh trái) của từng thẻ trong unit
  hasChildren: boolean
  collapsed: boolean
}

export interface LayoutSummary {
  parentId: string
  cx: number
  y: number
  count: number
  gens: [number, number]
}

export interface LayoutResult {
  nodes: LayoutNode[]
  summaries: LayoutSummary[]
  linkPaths: string[]
  spousePaths: string[]
  levels: { depth: number; y: number; generation: number }[]
  width: number
  height: number
  nodeById: Map<string, LayoutNode>
}

export interface LayoutOptions {
  rootIds: string[]
  isCollapsed: (unitId: string, depth: number) => boolean
  /** Nếu có: chỉ hiển thị các unit trong tập này (dùng cho chế độ "tổ tiên"). */
  only?: Set<string> | null
}

interface Measured {
  unitId: string
  depth: number
  width: number // bề rộng unit
  sub: number // bề rộng cả nhánh
  kids: Measured[]
  summary: { count: number; gens: [number, number] } | null
}

const unitWidth = (n: number) => n * CARD_W + (n - 1) * SPOUSE_GAP

function generationRange(model: FamilyModel, unitId: string): [number, number] {
  let lo = Infinity
  let hi = -Infinity
  const walk = (id: string, seen: Set<string>) => {
    for (const c of model.childUnits.get(id) ?? []) {
      if (seen.has(c)) continue
      seen.add(c)
      model.units.get(c)!.members.forEach(m => {
        lo = Math.min(lo, m.generation)
        hi = Math.max(hi, m.generation)
      })
      walk(c, seen)
    }
  }
  walk(unitId, new Set())
  return [isFinite(lo) ? lo : 0, isFinite(hi) ? hi : 0]
}

export function layoutTree(model: FamilyModel, opts: LayoutOptions): LayoutResult {
  const visited = new Set<string>()

  const measure = (unitId: string, depth: number): Measured => {
    visited.add(unitId)
    const unit = model.units.get(unitId)!
    const width = unitWidth(unit.members.length)
    let kids: Measured[] = []
    let summary: Measured['summary'] = null

    const allKids = (model.childUnits.get(unitId) ?? []).filter(
      c => !visited.has(c) && (!opts.only || opts.only.has(c)),
    )
    if (allKids.length > 0) {
      if (opts.isCollapsed(unitId, depth)) {
        summary = {
          count: countDescendants(model, unitId),
          gens: generationRange(model, unitId),
        }
      } else {
        kids = allKids.filter(c => !visited.has(c)).map(c => measure(c, depth + 1))
      }
    }

    const slots = kids.length + (summary ? 1 : 0)
    const kidsW =
      kids.reduce((s, k) => s + k.sub, 0) + (summary ? CARD_W : 0) + Math.max(0, slots - 1) * H_GAP
    return { unitId, depth, width, sub: Math.max(width, kidsW), kids, summary }
  }

  const measuredRoots: Measured[] = []
  opts.rootIds.forEach(id => {
    if (!visited.has(id)) measuredRoots.push(measure(id, 0))
  })

  const nodes: LayoutNode[] = []
  const summaries: LayoutSummary[] = []
  const links: string[] = []
  const spouseLinks: string[] = []
  const OX = PAD_X + LABEL_W
  const rowY = (depth: number) => PAD_Y + depth * (CARD_H + V_GAP)

  const place = (m: Measured, left: number) => {
    const unit = model.units.get(m.unitId)!
    const cx = left + m.sub / 2
    const y = rowY(m.depth)
    const x0 = cx - m.width / 2
    const cardXs = unit.members.map((_, i) => x0 + i * (CARD_W + SPOUSE_GAP))
    nodes.push({
      unit,
      depth: m.depth,
      cx,
      y,
      width: m.width,
      cardXs,
      hasChildren: m.kids.length > 0 || !!m.summary,
      collapsed: !!m.summary,
    })
    for (let i = 0; i < cardXs.length - 1; i++) {
      const yy = y + CARD_H / 2
      spouseLinks.push(`M${cardXs[i] + CARD_W} ${yy} H${cardXs[i + 1]}`)
    }

    // vị trí các con
    const items: { cx: number; top: number }[] = []
    const slots = m.kids.length + (m.summary ? 1 : 0)
    if (slots > 0) {
      const kidsW =
        m.kids.reduce((s, k) => s + k.sub, 0) + (m.summary ? CARD_W : 0) + (slots - 1) * H_GAP
      let cursor = cx - kidsW / 2
      m.kids.forEach(k => {
        place(k, cursor)
        items.push({ cx: cursor + k.sub / 2, top: rowY(k.depth) })
        cursor += k.sub + H_GAP
      })
      if (m.summary) {
        const scx = cursor + CARD_W / 2
        const sy = rowY(m.depth + 1)
        summaries.push({ parentId: m.unitId, cx: scx, y: sy, count: m.summary.count, gens: m.summary.gens })
        items.push({ cx: scx, top: sy })
      }
      // đường nối: thân dọc → thanh ngang → nhánh dọc
      const sy = y + CARD_H
      const busY = sy + V_GAP / 2
      let d = `M${cx} ${sy} V${busY}`
      if (items.length > 1) {
        const xs = items.map(i => i.cx)
        d += ` M${Math.min(...xs)} ${busY} H${Math.max(...xs)}`
      }
      items.forEach(i => (d += ` M${i.cx} ${busY} V${i.top}`))
      links.push(d)
    }
  }

  let cursor = OX
  measuredRoots.forEach(r => {
    place(r, cursor)
    cursor += r.sub + H_GAP * 2
  })

  const maxDepth = nodes.reduce((mx, n) => Math.max(mx, n.depth), 0)
  const hasSummaryBelow = summaries.length > 0
  const rows = maxDepth + 1 + (hasSummaryBelow && summaries.some(s => s.y > rowY(maxDepth)) ? 1 : 0)
  const width = Math.max(cursor - H_GAP * 2 + PAD_X, OX + PAD_X)
  const height = PAD_Y * 2 + rows * CARD_H + Math.max(0, rows - 1) * V_GAP

  // nhãn "Đời N" theo từng hàng
  const levels: LayoutResult['levels'] = []
  for (let d = 0; d < rows; d++) {
    const inRow = nodes.filter(n => n.depth === d)
    const gen = inRow.length
      ? Math.min(...inRow.map(n => n.unit.primary.generation))
      : Math.min(...summaries.filter(s => s.y === rowY(d)).map(s => s.gens[0] || 0), 0)
    levels.push({ depth: d, y: rowY(d), generation: gen })
  }

  const nodeById = new Map<string, LayoutNode>()
  nodes.forEach(n => nodeById.set(n.unit.id, n))

  return {
    nodes,
    summaries,
    linkPaths: links,
    spousePaths: spouseLinks,
    levels,
    width,
    height,
    nodeById,
  }
}
