'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { X, User, Calendar, Info, Plus, Pencil } from 'lucide-react'
import { getPhotoUrl } from '@/lib/utils'

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

// ── Gender accent colors ─────────────────────────────────────────
const GC = {
  male:   { border: '#2196F3', bg: 'rgba(33,150,243,0.08)' },
  female: { border: '#E91E8C', bg: 'rgba(233,30,140,0.08)' },
  other:  { border: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
}
function gc(g: string) { return GC[g as keyof typeof GC] ?? GC.other }

function parseSpouseIds(raw: string): string[] {
  try { return JSON.parse(raw) } catch { return [] }
}

interface CoupleUnit {
  key: string
  primary: FamilyMember
  spouse: FamilyMember | null
  fatherId: string | null
  motherId: string | null
}

function buildUnits(members: FamilyMember[]): CoupleUnit[] {
  const sorted = [...members].sort((a, b) => a.orderInGen - b.orderInGen)
  const placed = new Set<string>()
  const units: CoupleUnit[] = []

  for (let i = 0; i < sorted.length; i++) {
    const m = sorted[i]
    if (placed.has(m.id)) continue
    placed.add(m.id)

    const next = sorted[i + 1]
    const coupled = next && !placed.has(next.id) && parseSpouseIds(m.spouseIds).includes(next.id)

    if (coupled) {
      placed.add(next.id)
      const [left, right] = m.gender === 'female' && next.gender !== 'female' ? [next, m] : [m, next]
      units.push({
        key: `${left.id}:${right.id}`,
        primary: left,
        spouse: right,
        fatherId: left.gender !== 'female' ? left.id : right.gender !== 'female' ? right.id : left.id,
        motherId: left.gender === 'female' ? left.id : right.gender === 'female' ? right.id : null,
      })
    } else {
      units.push({
        key: m.id,
        primary: m,
        spouse: null,
        fatherId: m.gender !== 'female' ? m.id : null,
        motherId: m.gender === 'female' ? m.id : null,
      })
    }
  }
  return units
}

interface Rect { x: number; y: number; top: number; bottom: number; w: number; h: number }

export function FamilyTree({ members, onAddChild, onEdit }: FamilyTreeProps) {
  const [selected, setSelected]   = useState<FamilyMember | null>(null)
  const innerRef  = useRef<HTMLDivElement>(null)
  const cardRefs  = useRef<Record<string, HTMLDivElement>>({})
  const unitRefs  = useRef<Record<string, HTMLDivElement>>({})
  const [svgEls, setSvgEls]   = useState<React.ReactNode[]>([])
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 })

  const memberMap = useMemo(() => {
    const m: Record<string, FamilyMember> = {}
    members.forEach(mem => { m[mem.id] = mem })
    return m
  }, [members])

  const byGen = useMemo(() => {
    const map: Record<number, FamilyMember[]> = {}
    members.forEach(m => {
      if (!map[m.generation]) map[m.generation] = []
      map[m.generation].push(m)
    })
    return map
  }, [members])

  const unitsByGen = useMemo(() => {
    const result: Record<number, CoupleUnit[]> = {}
    Object.keys(byGen).forEach(g => { result[Number(g)] = buildUnits(byGen[Number(g)]) })
    return result
  }, [byGen])

  const generations = useMemo(
    () => Object.keys(byGen).map(Number).sort((a, b) => a - b),
    [byGen]
  )

  const getRect = useCallback((id: string): Rect | null => {
    const inner = innerRef.current
    const el = cardRefs.current[id]
    if (!inner || !el) return null
    const iR = inner.getBoundingClientRect()
    const eR = el.getBoundingClientRect()
    return {
      x:      eR.left - iR.left + eR.width / 2,
      y:      eR.top  - iR.top  + eR.height / 2,
      top:    eR.top    - iR.top,
      bottom: eR.bottom - iR.top,
      w: eR.width, h: eR.height,
    }
  }, [])

  const getUnitBottom = useCallback((key: string): number | null => {
    const inner = innerRef.current
    const el = unitRefs.current[key]
    if (!inner || !el) return null
    const iR = inner.getBoundingClientRect()
    return el.getBoundingClientRect().bottom - iR.top
  }, [])

  const calcLines = useCallback(() => {
    const inner = innerRef.current
    if (!inner) return
    setSvgSize({ w: inner.scrollWidth, h: inner.scrollHeight })

    const els: React.ReactNode[] = []
    const drawnSpouses = new Set<string>()

    // ── 1. Couple connector — horizontal line in the gap between the two cards ──
    members.forEach(m => {
      parseSpouseIds(m.spouseIds).forEach(sid => {
        const pairKey = [m.id, sid].sort().join('|')
        if (drawnSpouses.has(pairKey)) return
        drawnSpouses.add(pairKey)

        const r1 = getRect(m.id)
        const r2 = getRect(sid)
        if (!r1 || !r2) return

        const left  = r1.x < r2.x ? r1 : r2
        const right = r1.x < r2.x ? r2 : r1
        const connY = (left.y + right.y) / 2
        const x1    = left.x  + left.w  / 2
        const x2    = right.x - right.w / 2

        els.push(
          <line key={`sp-${pairKey}`}
            x1={x1} y1={connY} x2={x2} y2={connY}
            stroke="#9ca3af" strokeWidth="2"
          />
        )
      })
    })

    // ── 2. Parent → child connector lines ───────────────────────
    const coupleKids: Record<string, FamilyMember[]> = {}
    members.forEach(child => {
      if (!child.fatherId && !child.motherId) return
      const key = `${child.fatherId ?? ''}_${child.motherId ?? ''}`
      if (!coupleKids[key]) coupleKids[key] = []
      coupleKids[key].push(child)
    })

    const findUnitKey = (fid: string | null, mid: string | null): string | null => {
      for (const gen of Object.values(unitsByGen)) {
        for (const u of gen) {
          if (u.fatherId === fid && u.motherId === mid) return u.key
          if (u.fatherId === fid && mid === null) return u.key
          if (u.motherId === mid && fid === null) return u.key
        }
      }
      return null
    }

    Object.entries(coupleKids).forEach(([key, kids]) => {
      const [fid, mid_str] = key.split('_')
      const mid = mid_str || null
      const fp = fid ? getRect(fid) : null
      const mp = mid ? getRect(mid) : null
      if (!fp && !mp) return

      let parentX: number
      let cardBottom: number

      if (fp && mp) {
        parentX    = (fp.x + mp.x) / 2
        cardBottom = Math.max(fp.bottom, mp.bottom)
      } else {
        const p    = fp ?? mp!
        parentX    = p.x
        cardBottom = p.bottom
      }

      const uKey = findUnitKey(fid || null, mid || null)
      const uBottom = uKey ? getUnitBottom(uKey) : null
      const effectiveBottom = Math.max(cardBottom, uBottom ?? 0)

      const childRects = kids.map(c => getRect(c.id)).filter(Boolean) as Rect[]
      if (!childRects.length) return

      const minChildTop = Math.min(...childRects.map(c => c.top))
      const gap = minChildTop - effectiveBottom
      const jY  = effectiveBottom + Math.max(gap * 0.5, 16)

      els.push(
        <line key={`pd-${key}`}
          x1={parentX} y1={effectiveBottom} x2={parentX} y2={jY}
          className="family-tree-line"
        />
      )

      if (childRects.length > 1) {
        const xs = childRects.map(c => c.x)
        els.push(
          <line key={`jb-${key}`}
            x1={Math.min(...xs)} y1={jY} x2={Math.max(...xs)} y2={jY}
            className="family-tree-line"
          />
        )
      }

      kids.forEach((child, i) => {
        const cr = childRects[i]
        if (!cr) return
        els.push(
          <g key={`ct-${child.id}`}>
            <line x1={cr.x} y1={jY} x2={cr.x} y2={cr.top} className="family-tree-line" />
            <circle cx={cr.x} cy={cr.top} r="3" className="family-tree-dot" />
          </g>
        )
      })
    })

    setSvgEls(els)
  }, [members, getRect, getUnitBottom, unitsByGen])

  useEffect(() => {
    const t = setTimeout(calcLines, 80)
    return () => clearTimeout(t)
  }, [calcLines])

  useEffect(() => {
    window.addEventListener('resize', calcLines)
    return () => window.removeEventListener('resize', calcLines)
  }, [calcLines])

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
        <div ref={innerRef} className="relative min-w-max px-10 pt-6 pb-16">

          {/* SVG connector overlay */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={svgSize.w || '100%'}
            height={svgSize.h || '100%'}
            style={{ overflow: 'visible' }}
          >
            {svgEls}
          </svg>

          {/* Generations */}
          {generations.map(gen => (
            <div key={gen} className="mb-2 relative z-10">

              {/* Couple units */}
              <div className="flex gap-14 justify-center mb-14 flex-wrap">
                {unitsByGen[gen]?.map(unit => (
                  <div
                    key={unit.key}
                    ref={el => { if (el) unitRefs.current[unit.key] = el }}
                    className="flex flex-col items-center"
                  >
                    {/* Cards — gap-6 so midpoint line passes between them */}
                    <div className="flex gap-6 items-start">
                      <MemberCard
                        member={unit.primary}
                        isSelected={selected?.id === unit.primary.id}
                        onClick={() => setSelected(selected?.id === unit.primary.id ? null : unit.primary)}
                        cardRef={el => { if (el) cardRefs.current[unit.primary.id] = el }}
                        onEdit={onEdit}
                      />
                      {unit.spouse && (
                        <MemberCard
                          member={unit.spouse}
                          isSelected={selected?.id === unit.spouse.id}
                          onClick={() => setSelected(selected?.id === unit.spouse!.id ? null : unit.spouse!)}
                          cardRef={el => { if (el) cardRefs.current[unit.spouse!.id] = el }}
                          onEdit={onEdit}
                        />
                      )}
                    </div>

                    {/* [+] Add child button */}
                    {onAddChild && (
                      <button
                        onClick={() => onAddChild({
                          fatherId: unit.fatherId,
                          motherId: unit.motherId,
                          generation: unit.primary.generation + 1,
                        })}
                        className="btn-tree-add mt-4 w-7 h-7 rounded-full flex items-center justify-center"
                        title="Thêm con"
                      >
                        <Plus size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
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
  cardRef: (el: HTMLDivElement | null) => void
  onEdit?: (member: FamilyMember) => void
}

function MemberCard({ member, isSelected, onClick, cardRef, onEdit }: CardProps) {
  const c = gc(member.gender)
  const roleLabel =
    member.gender === 'male' ? 'Nam' : member.gender === 'female' ? 'Nữ' : 'Khác'

  return (
    <div
      ref={cardRef}
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
        {/* Avatar — round */}
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

        {/* Name */}
        <p className="text-[11px] font-semibold leading-tight line-clamp-2"
          style={{ color: 'var(--text-1)' }}>
          {member.name}
        </p>
        {member.nickname && (
          <p className="text-[10px] mt-0.5" style={{ color: c.border, opacity: 0.8 }}>
            ({member.nickname})
          </p>
        )}

        {/* Role */}
        <p className="text-[10px] mt-1 font-medium" style={{ color: c.border }}>
          {roleLabel}
        </p>

        {/* Dates */}
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

      {/* [✏️] Edit button — bottom-right corner */}
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
  const spouses = parseSpouseIds(member.spouseIds).map(id => memberMap[id]).filter(Boolean) as FamilyMember[]
  const children = Object.values(memberMap).filter(m => m.fatherId === member.id || m.motherId === member.id)

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
                {member.gender === 'male' ? '👨 Nam' : member.gender === 'female' ? '👩 Nữ' : '🧑 Khác'}
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
