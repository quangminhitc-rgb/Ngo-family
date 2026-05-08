'use client'

import React, { useState, useMemo } from 'react'
import { X, User, Calendar, Info, Plus, Pencil } from 'lucide-react'
import { getPhotoUrl } from '@/lib/utils'

// ── Public interfaces ────────────────────────────────────────────
export interface FamilyMember {
  id: string
  name: string
  nickname: string | null
  gender: string
  birthDate: string | null
  isLunarBirth: boolean
  deathDate: string | null
  isLunarDeath: boolean
  bio: string | null
  photoUrl: string | null
  generation: number
  orderInGen: number
  fatherId: string | null
  motherId: string | null
  spouseIds: string
}

export interface AddChildDefaults {
  fatherId: string | null
  motherId: string | null
  generation: number
}

interface FamilyTreeProps {
  members: FamilyMember[]
  onAddChild?: (defaults: AddChildDefaults) => void
  onEdit?: (member: FamilyMember) => void
}

// ── Gender colors ────────────────────────────────────────────────
const GC = {
  male:   { border: '#2196F3', bg: 'rgba(33,150,243,0.08)' },
  female: { border: '#E91E8C', bg: 'rgba(233,30,140,0.08)' },
  other:  { border: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
}
function gc(g: string) { return GC[g as keyof typeof GC] ?? GC.other }

function parseSpouseIds(raw: string): string[] {
  try { return JSON.parse(raw) } catch { return [] }
}

// ── Couple-unit builder ──────────────────────────────────────────
// Groups one generation's members into [primary, spouse?] pairs.
// Scans all remaining members (not just adjacent) to find a spouse,
// so couples with non-consecutive orderInGen are paired correctly.
interface CoupleUnit {
  key: string
  primary: FamilyMember
  spouse: FamilyMember | null
  fatherId: string | null   // ID of the father in this unit (for add-child)
  motherId: string | null
}

function buildUnits(members: FamilyMember[]): CoupleUnit[] {
  const sorted = [...members].sort((a, b) => a.orderInGen - b.orderInGen)
  const placed = new Set<string>()
  const units: CoupleUnit[] = []

  for (const m of sorted) {
    if (placed.has(m.id)) continue
    placed.add(m.id)

    const spouseIds = parseSpouseIds(m.spouseIds)
    const spouse = sorted.find(s => !placed.has(s.id) && spouseIds.includes(s.id))

    if (spouse) {
      placed.add(spouse.id)
      // Male (or non-female) goes on left as primary
      const [left, right] = m.gender === 'female' && spouse.gender !== 'female'
        ? [spouse, m] : [m, spouse]
      units.push({
        key: `${left.id}:${right.id}`,
        primary: left,
        spouse: right,
        fatherId: left.gender !== 'female' ? left.id
                : right.gender !== 'female' ? right.id : left.id,
        motherId: left.gender === 'female'  ? left.id
                : right.gender === 'female' ? right.id : null,
      })
    } else {
      units.push({
        key: m.id,
        primary: m,
        spouse: null,
        fatherId: m.gender !== 'female' ? m.id : null,
        motherId: m.gender === 'female'  ? m.id : null,
      })
    }
  }
  return units
}

// ════════════════════════════════════════════════════════════════
//  LAYOUT ENGINE — calculateLayout()
//
//  Algorithm (Reingold–Tilford inspired, adapted for couple units):
//
//  1. LAYERING    : generation field maps directly to Y row.
//  2. UNIT TREE   : build a tree where each node is a CoupleUnit.
//                   Parent of a unit = unit containing the primary
//                   (or spouse) member's fatherId / motherId.
//  3. BOTTOM-UP   : compute subtreeW = max(own cards width,
//                   sum of children subtreeW + gaps).
//  4. TOP-DOWN    : assign cx (center X) recursively.
//                   Children are centered under their parent.
//  5. POSITIONS   : card left = cx ± offset, card top = f(generation).
//
//  Spacing rules:
//    CG  = 24px  gap between couple's two cards (tight, they're a unit)
//    SG  = 56px  gap between sibling units in the same generation
//    FG  = 80px  gap between unrelated root sub-trees
//    VG  = 130px vertical gap (parent card bottom → child card top)
//
//  Multiple spouses: only the FIRST found spouse is paired into
//  a CoupleUnit. Additional spouses appear as solo units. Their
//  couple line (a dashed stroke) can be drawn if needed.
// ════════════════════════════════════════════════════════════════

// Layout constants
const CW  = 110   // card width  (must match w-[110px] in MemberCard)
const CH  = 180   // card height (approximate; used for connector math)
const CG  = 24    // couple gap  (gap-6)
const SG  = 56    // sibling gap (gap-14)
const FG  = 80    // root-family gap
const VG  = 130   // vertical gap between generations
const PX  = 60    // canvas horizontal padding
const PY  = 40    // canvas top padding
const CLO = 20    // couple-line Y-offset above card top

const unitCardsW = (hasSpouse: boolean) => hasSpouse ? CW * 2 + CG : CW

// Tree node carrying layout state
interface UnitNode {
  key: string
  primary: FamilyMember
  spouse: FamilyMember | null
  fatherId: string | null
  motherId: string | null
  generation: number
  children: UnitNode[]
  subtreeW: number   // width needed to render this subtree without overlap
  cx: number         // absolute center X (= visual midpoint of the two cards)
}

// Per-card CSS position
interface CardPos { left: number; top: number; cx: number }

interface LayoutResult {
  positions: Record<string, CardPos>
  allUnits: UnitNode[]
  totalW: number
  totalH: number
}

function calculateLayout(members: FamilyMember[]): LayoutResult {
  const empty: LayoutResult = { positions: {}, allUnits: [], totalW: 400, totalH: 300 }
  if (!members.length) return empty

  // ── Step 1: Group by generation, build CoupleUnits ─────────────
  const byGen: Record<number, FamilyMember[]> = {}
  members.forEach(m => {
    ;(byGen[m.generation] ??= []).push(m)
  })

  const allUnits: UnitNode[] = []
  const memberToUnit: Record<string, UnitNode> = {}

  Object.keys(byGen).forEach(g => {
    const gen = Number(g)
    buildUnits(byGen[gen]).forEach(cu => {
      const node: UnitNode = {
        key: cu.key,
        primary: cu.primary,
        spouse: cu.spouse,
        fatherId: cu.fatherId,
        motherId: cu.motherId,
        generation: gen,
        children: [],
        subtreeW: 0,
        cx: 0,
      }
      allUnits.push(node)
      memberToUnit[cu.primary.id] = node
      if (cu.spouse) memberToUnit[cu.spouse.id] = node
    })
  })

  // ── Step 2: Connect parent → child units ───────────────────────
  // A unit's parent = the unit that contains the fatherId or motherId
  // of either the primary member or the spouse (primary checked first).
  const hasParent = new Set<string>()

  allUnits.forEach(u => {
    for (const member of ([u.primary, u.spouse].filter(Boolean) as FamilyMember[])) {
      const parentUnit =
        (member.fatherId ? memberToUnit[member.fatherId] : null) ??
        (member.motherId ? memberToUnit[member.motherId] : null)

      if (parentUnit && parentUnit.key !== u.key) {
        if (!parentUnit.children.find(c => c.key === u.key)) {
          parentUnit.children.push(u)
        }
        hasParent.add(u.key)
        break
      }
    }
  })

  // Sort children by primary.orderInGen so siblings render left→right
  allUnits.forEach(u => {
    u.children.sort((a, b) => a.primary.orderInGen - b.primary.orderInGen)
  })

  const roots = allUnits.filter(u => !hasParent.has(u.key))

  // ── Step 3: Bottom-up — compute subtreeW ───────────────────────
  // subtreeW = max(own cards width, sum of children subtreeW + sibling gaps)
  // This ensures no two subtrees overlap.
  function calcW(u: UnitNode): number {
    const own = unitCardsW(!!u.spouse)
    if (!u.children.length) { u.subtreeW = own; return own }
    const childTotal = u.children.reduce(
      (s, c, i) => s + calcW(c) + (i > 0 ? SG : 0), 0
    )
    u.subtreeW = Math.max(own, childTotal)
    return u.subtreeW
  }
  roots.forEach(calcW)

  // ── Step 4: Top-down — assign center X ─────────────────────────
  // cx = leftBound + subtreeW / 2  (center of the subtree's bounding box)
  // Children are spread starting from  cx - childrenTotalW/2,
  // so the parent is always visually centered above its children.
  function assignCX(u: UnitNode, leftBound: number) {
    u.cx = leftBound + u.subtreeW / 2
    if (!u.children.length) return
    const childrenW = u.children.reduce(
      (s, c, i) => s + c.subtreeW + (i > 0 ? SG : 0), 0
    )
    let x = u.cx - childrenW / 2
    u.children.forEach(child => { assignCX(child, x); x += child.subtreeW + SG })
  }

  let left = PX
  roots.forEach(r => { assignCX(r, left); left += r.subtreeW + FG })

  // ── Step 5: Compute per-card CSS positions ─────────────────────
  // Couple unit  : primary left of cx, spouse right of cx, gap CG between them.
  // Single unit  : card centered on cx.
  const positions: Record<string, CardPos> = {}
  let maxRight = 0, maxBottom = 0

  allUnits.forEach(u => {
    const cardTop = PY + (u.generation - 1) * (CH + VG)
    if (u.spouse) {
      const pLeft = u.cx - CW - CG / 2
      const sLeft = u.cx + CG / 2
      positions[u.primary.id] = { left: pLeft, top: cardTop, cx: pLeft + CW / 2 }
      positions[u.spouse.id]  = { left: sLeft, top: cardTop, cx: sLeft + CW / 2 }
      maxRight = Math.max(maxRight, sLeft + CW)
    } else {
      const cLeft = u.cx - CW / 2
      positions[u.primary.id] = { left: cLeft, top: cardTop, cx: u.cx }
      maxRight = Math.max(maxRight, cLeft + CW)
    }
    maxBottom = Math.max(maxBottom, cardTop + CH)
  })

  return { positions, allUnits, totalW: maxRight + PX, totalH: maxBottom + PY }
}

// ════════════════════════════════════════════════════════════════
//  SVG CONNECTOR BUILDER — buildSvgLines()
//
//  All coordinates come from the layout engine — zero DOM queries.
//
//  Connector anatomy per parent unit:
//
//    [parent cards]          ← cardTop .. cardTop+CH
//         │  parentCX
//         │  (vertical, CH px tall)
//    ─────┼─────────────     ← jY = cardTop+CH + VG/2  (junction)
//         │    │    │        (horizontal branch spans child unitCXs)
//         ●    ●    ●        ← connectY (dot = T-junction on child couple line)
//        [child units]       ← child cardTop = jY + VG/2 - CLO
//
//  Couple line (horizontal):
//    y = cardTop - CLO  (20 px above cards)
//    x1 = primary cx,  x2 = spouse cx
//
//  Edge style: orthogonal (L-shape / T-shape).
//  To use Bézier curves instead, replace <line> with <path> using
//  cubic bezier:  M x1 y1  C x1 jY  x2 jY  x2 y2
// ════════════════════════════════════════════════════════════════

function buildSvgLines(
  allUnits: UnitNode[],
  positions: Record<string, CardPos>,
): React.ReactNode[] {
  const els: React.ReactNode[] = []
  const drawnCouples = new Set<string>()

  allUnits.forEach(u => {
    const pp = positions[u.primary.id]
    if (!pp) return

    // ── 1. Couple line ───────────────────────────────────────────
    if (u.spouse) {
      const sp = positions[u.spouse.id]
      if (sp) {
        const pairKey = [u.primary.id, u.spouse.id].sort().join('|')
        if (!drawnCouples.has(pairKey)) {
          drawnCouples.add(pairKey)
          const y = pp.top - CLO
          els.push(
            <line key={`sp-${pairKey}`}
              x1={pp.cx} y1={y} x2={sp.cx} y2={y}
              stroke="#9ca3af" strokeWidth="2"
            />
          )
        }
      }
    }

    // ── 2. Parent → children connectors ─────────────────────────
    if (!u.children.length) return

    const parentBottomY = pp.top + CH
    const jY = parentBottomY + VG / 2   // junction halfway down the gap

    // Parent couple visual center (midpoint of the two card centers)
    const parentCX = u.spouse && positions[u.spouse.id]
      ? (pp.cx + positions[u.spouse.id].cx) / 2
      : pp.cx

    // One drop per child unit
    const drops = u.children.flatMap(child => {
      const cp = positions[child.primary.id]
      if (!cp) return []
      // Child's unit visual center X
      const childCX = child.spouse && positions[child.spouse.id]
        ? (cp.cx + positions[child.spouse.id].cx) / 2
        : cp.cx
      // T-junction lands on child's couple line (or card top for singles)
      const connectY = child.spouse ? cp.top - CLO : cp.top
      return [{ centerX: childCX, connectY }]
    })

    if (!drops.length) return

    const xs = drops.map(d => d.centerX)

    // Vertical: parent couple center → junction Y
    els.push(
      <line key={`pv-${u.key}`}
        x1={parentCX} y1={parentBottomY} x2={parentCX} y2={jY}
        className="family-tree-line"
      />
    )

    // Horizontal branch at jY — always includes parentCX for proper T-junction
    const bx1 = Math.min(...xs, parentCX)
    const bx2 = Math.max(...xs, parentCX)
    if (bx1 < bx2) {
      els.push(
        <line key={`bh-${u.key}`}
          x1={bx1} y1={jY} x2={bx2} y2={jY}
          className="family-tree-line"
        />
      )
    }

    // Vertical drops + dot at each child's connect point
    drops.forEach((drop, i) => {
      els.push(
        <g key={`cd-${u.key}-${i}`}>
          <line x1={drop.centerX} y1={jY} x2={drop.centerX} y2={drop.connectY}
            className="family-tree-line" />
          <circle cx={drop.centerX} cy={drop.connectY} r="3"
            className="family-tree-dot" />
        </g>
      )
    })
  })

  return els
}

// ── FamilyTree component ─────────────────────────────────────────
export function FamilyTree({ members, onAddChild, onEdit }: FamilyTreeProps) {
  const [selected, setSelected] = useState<FamilyMember | null>(null)

  const memberMap = useMemo(() => {
    const m: Record<string, FamilyMember> = {}
    members.forEach(mem => { m[mem.id] = mem })
    return m
  }, [members])

  const layout  = useMemo(() => calculateLayout(members), [members])
  const svgLines = useMemo(
    () => buildSvgLines(layout.allUnits, layout.positions),
    [layout],
  )

  if (!members.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 text-3xl"
          style={{ background: 'var(--surface-2)' }}>🌳</div>
        <p className="text-lg" style={{ color: 'var(--text-3)' }}>Chưa có thành viên nào</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)', opacity: 0.6 }}>
          Thêm thành viên trong trang quản trị
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto overflow-y-visible pb-8">
        <div className="relative" style={{ width: layout.totalW, height: layout.totalH, minWidth: '100%' }}>

          {/* SVG connector overlay — positions are purely computed, no DOM queries */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={layout.totalW}
            height={layout.totalH}
            style={{ overflow: 'visible' }}
          >
            {svgLines}
          </svg>

          {/* Member cards — absolutely positioned by layout engine */}
          {layout.allUnits.map(unit => {
            const pp = layout.positions[unit.primary.id]
            if (!pp) return null
            const sp = unit.spouse ? layout.positions[unit.spouse.id] : null

            return (
              <React.Fragment key={unit.key}>
                {/* Primary card */}
                <div className="absolute" style={{ left: pp.left, top: pp.top }}>
                  <MemberCard
                    member={unit.primary}
                    isSelected={selected?.id === unit.primary.id}
                    onClick={() => setSelected(p =>
                      p?.id === unit.primary.id ? null : unit.primary)}
                    onEdit={onEdit}
                  />
                </div>

                {/* Spouse card */}
                {unit.spouse && sp && (
                  <div className="absolute" style={{ left: sp.left, top: sp.top }}>
                    <MemberCard
                      member={unit.spouse}
                      isSelected={selected?.id === unit.spouse.id}
                      onClick={() => setSelected(p =>
                        p?.id === unit.spouse!.id ? null : unit.spouse!)}
                      onEdit={onEdit}
                    />
                  </div>
                )}

                {/* Add child button — centered under the couple unit */}
                {onAddChild && (
                  <button
                    className="btn-tree-add absolute w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ left: unit.cx - 14, top: pp.top + CH + 10 }}
                    onClick={() => onAddChild({
                      fatherId: unit.fatherId,
                      motherId: unit.motherId,
                      generation: unit.generation + 1,
                    })}
                    title="Thêm con"
                  >
                    <Plus size={13} />
                  </button>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {selected && (
        <MemberDetailPanel
          member={selected}
          memberMap={memberMap}
          onClose={() => setSelected(null)}
          onSelect={setSelected}
        />
      )}
    </div>
  )
}

// ── Member card ───────────────────────────────────────────────────
interface CardProps {
  member: FamilyMember
  isSelected: boolean
  onClick: () => void
  onEdit?: (member: FamilyMember) => void
}

function MemberCard({ member, isSelected, onClick, onEdit }: CardProps) {
  const c = gc(member.gender)
  const roleLabel =
    member.gender === 'male' ? 'Nam' : member.gender === 'female' ? 'Nữ' : 'Khác'

  return (
    <div
      onClick={onClick}
      className={`w-[110px] rounded-2xl border-2 cursor-pointer transition-all duration-200 text-center select-none relative group ${
        isSelected ? 'scale-105' : 'hover:-translate-y-1'
      }`}
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: isSelected ? 'var(--accent)' : c.border,
        boxShadow: isSelected
          ? `0 0 0 3px ${c.border}33, 0 8px 20px rgba(0,0,0,0.15)`
          : '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <div className="px-2 pt-3 pb-5">
        <div
          className="w-14 h-14 rounded-full mx-auto mb-2 overflow-hidden border-2 flex items-center justify-center"
          style={{ borderColor: c.border, backgroundColor: c.bg }}
        >
          {member.photoUrl ? (
            <img src={getPhotoUrl(member.photoUrl)} alt={member.name}
              className="w-full h-full object-cover" />
          ) : (
            <User size={22} style={{ color: c.border }} />
          )}
        </div>

        <p className="text-[11px] font-semibold leading-tight line-clamp-2"
          style={{ color: 'var(--text-1)' }}>
          {member.name}
        </p>
        {member.nickname && (
          <p className="text-[10px] mt-0.5" style={{ color: c.border, opacity: 0.8 }}>
            ({member.nickname})
          </p>
        )}
        <p className="text-[10px] mt-1 font-medium" style={{ color: c.border }}>
          {roleLabel}
        </p>
        {(member.birthDate || member.deathDate) && (
          <p className="text-[9px] mt-1.5 leading-tight" style={{ color: 'var(--text-3)' }}>
            {member.birthDate
              ? (member.isLunarBirth ? '🌙' : '') + member.birthDate
              : '?'}
            {member.deathDate
              ? ` – ${member.isLunarDeath ? '🌙' : ''}${member.deathDate}`
              : ''}
          </p>
        )}
      </div>

      {onEdit && (
        <button
          onClick={e => { e.stopPropagation(); onEdit(member) }}
          className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded flex items-center justify-center transition-opacity opacity-25 hover:opacity-100"
          style={{ color: 'var(--text-3)' }}
          title="Chỉnh sửa"
        >
          <Pencil size={10} />
        </button>
      )}
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────
interface DetailProps {
  member: FamilyMember
  memberMap: Record<string, FamilyMember>
  onClose: () => void
  onSelect: (m: FamilyMember) => void
}

function MemberDetailPanel({ member, memberMap, onClose, onSelect }: DetailProps) {
  const c       = gc(member.gender)
  const father  = member.fatherId ? memberMap[member.fatherId] : null
  const mother  = member.motherId ? memberMap[member.motherId] : null
  const spouses = parseSpouseIds(member.spouseIds)
    .map(id => memberMap[id]).filter(Boolean) as FamilyMember[]
  const children = Object.values(memberMap).filter(
    m => m.fatherId === member.id || m.motherId === member.id,
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="rounded-2xl w-full max-w-sm shadow-lg animate-slide-up overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="h-1.5 w-full" style={{ backgroundColor: c.border }} />

        {/* Header */}
        <div className="relative p-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 flex-shrink-0 flex items-center justify-center"
              style={{ borderColor: c.border, backgroundColor: c.bg }}>
              {member.photoUrl ? (
                <img src={getPhotoUrl(member.photoUrl)} alt={member.name}
                  className="w-full h-full object-cover" />
              ) : (
                <User size={28} style={{ color: c.border }} />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-1)' }}>
                {member.name}
              </h3>
              {member.nickname && (
                <p className="text-sm mt-0.5" style={{ color: c.border }}>"{member.nickname}"</p>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                {member.gender === 'male' ? '👨 Nam'
                  : member.gender === 'female' ? '👩 Nữ' : '🧑 Khác'}
                {' · Thế hệ '}{member.generation}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {(member.birthDate || member.deathDate) && (
            <div className="flex gap-4 flex-wrap">
              {member.birthDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} color="#52a852" />
                  <span style={{ color: 'var(--text-2)' }}>
                    {member.isLunarBirth ? '🌙 ' : ''}{member.birthDate}
                  </span>
                </div>
              )}
              {member.deathDate && (
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: 'var(--danger)' }}>†</span>
                  <span style={{ color: 'var(--text-2)' }}>
                    {member.isLunarDeath ? '🌙 ' : ''}{member.deathDate}
                  </span>
                </div>
              )}
            </div>
          )}

          {member.bio && (
            <div className="flex items-start gap-2">
              <Info size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-3)' }} />
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{member.bio}</p>
            </div>
          )}

          {(father || mother || spouses.length > 0 || children.length > 0) && (
            <div className="space-y-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                Quan hệ
              </p>

              {(father || mother) && (
                <div>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>Cha mẹ</p>
                  <div className="flex gap-2 flex-wrap">
                    {[father, mother].filter(Boolean).map(p => p && (
                      <button key={p.id} onClick={() => onSelect(p)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        <User size={11} style={{ color: 'var(--text-3)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-1)' }}>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {spouses.length > 0 && (
                <div>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>Vợ / Chồng</p>
                  <div className="flex flex-wrap gap-2">
                    {spouses.map(s => (
                      <button key={s.id} onClick={() => onSelect(s)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
                        style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)' }}>
                        <span className="text-[10px]">❤️</span>
                        <span className="text-xs" style={{ color: 'var(--text-1)' }}>{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {children.length > 0 && (
                <div>
                  <p className="text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>
                    Con cái ({children.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {children.map(ch => (
                      <button key={ch.id} onClick={() => onSelect(ch)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        <User size={11} style={{ color: 'var(--text-3)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-1)' }}>{ch.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
