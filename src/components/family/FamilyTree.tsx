'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { X, User, Calendar, Info, Plus } from 'lucide-react'
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
  spouseIds: string // JSON array
}

export interface AddChildDefaults {
  fatherId: string | null
  motherId: string | null
  generation: number
}

interface FamilyTreeProps {
  members: FamilyMember[]
  onAddChild?: (defaults: AddChildDefaults) => void
}

// ── colours ──────────────────────────────────────────────────
const GC = {
  male:   { bg: '#0b1e2e', border: '#1e4f80', text: '#5a9fd4', accent: '#1e4f80' },
  female: { bg: '#260f22', border: '#80206a', text: '#d46ab0', accent: '#80206a' },
  other:  { bg: '#131320', border: '#424278', text: '#8888c4', accent: '#424278' },
}
function gc(g: string) { return GC[g as keyof typeof GC] ?? GC.other }

function parseSpouseIds(raw: string): string[] {
  try { return JSON.parse(raw) } catch { return [] }
}

// ── couple-unit helpers ───────────────────────────────────────
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
      // male left, female right when possible
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

// ── SVG rect helper ───────────────────────────────────────────
interface Rect { x: number; y: number; top: number; bottom: number; w: number; h: number }

// ── main component ────────────────────────────────────────────
export function FamilyTree({ members, onAddChild }: FamilyTreeProps) {
  const [selected, setSelected] = useState<FamilyMember | null>(null)
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

    // ── 1. Spouse lines (horizontal near top of cards) ────────
    members.forEach(m => {
      parseSpouseIds(m.spouseIds).forEach(sid => {
        const key = [m.id, sid].sort().join('|')
        if (drawnSpouses.has(key)) return
        drawnSpouses.add(key)
        const r1 = getRect(m.id)
        const r2 = getRect(sid)
        if (!r1 || !r2) return

        // line at top-quarter of the shorter card
        const lineY = Math.min(r1.top, r2.top) + Math.min(r1.h, r2.h) * 0.22
        const mx    = (r1.x + r2.x) / 2

        els.push(
          <g key={`sp-${key}`}>
            <line
              x1={r1.x} y1={lineY} x2={r2.x} y2={lineY}
              stroke="#c9a84c" strokeWidth="2" strokeDasharray="6 3" opacity="0.7"
            />
            <text x={mx} y={lineY - 3} textAnchor="middle" fontSize="9" fill="#c9a84c" opacity="0.85">♥</text>
          </g>
        )
      })
    })

    // ── 2. Parent → child lines ────────────────────────────────
    // Group children by (fatherId, motherId) key
    const coupleKids: Record<string, FamilyMember[]> = {}
    members.forEach(child => {
      if (!child.fatherId && !child.motherId) return
      const key = `${child.fatherId ?? ''}_${child.motherId ?? ''}`
      if (!coupleKids[key]) coupleKids[key] = []
      coupleKids[key].push(child)
    })

    // Find couple unit key for a fatherId+motherId pair
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
      const [fid, mid] = key.split('_')
      const fp = fid ? getRect(fid) : null
      const mp = mid ? getRect(mid) : null
      if (!fp && !mp) return

      // Parent centre-X and bottom-Y (use unit bottom to account for + button)
      let parentX: number, parentBottom: number
      if (fp && mp) {
        parentX      = (fp.x + mp.x) / 2
        parentBottom = Math.max(fp.bottom, mp.bottom)
      } else {
        const p = fp ?? mp!
        parentX = p.x; parentBottom = p.bottom
      }

      // Use unit wrapper bottom (includes + button) if available
      const uKey = findUnitKey(fid || null, mid || null)
      const uBottom = uKey ? getUnitBottom(uKey) : null
      if (uBottom && uBottom > parentBottom) parentBottom = uBottom

      const childRects = kids.map(c => getRect(c.id)).filter(Boolean) as Rect[]
      if (!childRects.length) return

      const minChildTop = Math.min(...childRects.map(c => c.top))
      const gap         = minChildTop - parentBottom
      const jY          = parentBottom + Math.max(gap * 0.5, 16)

      // Vertical down from parents
      els.push(<line key={`pd-${key}`} x1={parentX} y1={parentBottom} x2={parentX} y2={jY} stroke="#333" strokeWidth="1.5" />)

      // Horizontal bar if multiple children
      if (childRects.length > 1) {
        const xs = childRects.map(c => c.x)
        els.push(<line key={`jb-${key}`} x1={Math.min(...xs)} y1={jY} x2={Math.max(...xs)} y2={jY} stroke="#333" strokeWidth="1.5" />)
      }

      // Vertical up to each child top
      kids.forEach((child, i) => {
        const cr = childRects[i]
        if (!cr) return
        // Small dot at connection point on child top
        els.push(
          <g key={`ct-${child.id}`}>
            <line x1={cr.x} y1={jY} x2={cr.x} y2={cr.top} stroke="#333" strokeWidth="1.5" />
            <circle cx={cr.x} cy={cr.top} r="3" fill="#2a2a2a" stroke="#444" strokeWidth="1" />
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
        <div className="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4 text-3xl">🌳</div>
        <p className="text-[#666] text-lg">Chưa có thành viên nào</p>
        <p className="text-[#444] text-sm mt-1">Thêm thành viên trong trang quản trị</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto overflow-y-visible pb-8">
        <div ref={innerRef} className="relative min-w-max px-10 pt-6 pb-16">
          {/* SVG overlay */}
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
              {/* Label */}
              <div className="flex items-center gap-3 mb-8">
                <span className="text-[11px] font-semibold text-[#3a3a3a] uppercase tracking-widest whitespace-nowrap">
                  Thế hệ {gen}
                </span>
                <div className="flex-1 h-px bg-[#1a1a1a]" />
              </div>

              {/* Couple units row */}
              <div className="flex gap-14 justify-center mb-14 flex-wrap">
                {unitsByGen[gen]?.map(unit => (
                  <div
                    key={unit.key}
                    ref={el => { if (el) unitRefs.current[unit.key] = el }}
                    className="flex flex-col items-center gap-0"
                  >
                    {/* Cards */}
                    <div className="flex gap-3 items-start">
                      <MemberCard
                        member={unit.primary}
                        isSelected={selected?.id === unit.primary.id}
                        onClick={() => setSelected(selected?.id === unit.primary.id ? null : unit.primary)}
                        cardRef={el => { if (el) cardRefs.current[unit.primary.id] = el }}
                      />
                      {unit.spouse && (
                        <MemberCard
                          member={unit.spouse}
                          isSelected={selected?.id === unit.spouse.id}
                          onClick={() => setSelected(selected?.id === unit.spouse!.id ? null : unit.spouse!)}
                          cardRef={el => { if (el) cardRefs.current[unit.spouse!.id] = el }}
                        />
                      )}
                    </div>

                    {/* Quick-add child button */}
                    {onAddChild && (
                      <button
                        onClick={() => onAddChild({
                          fatherId: unit.fatherId,
                          motherId: unit.motherId,
                          generation: unit.primary.generation + 1,
                        })}
                        className="mt-3 w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#c9a84c]/50 hover:bg-[#c9a84c]/10 flex items-center justify-center text-[#555] hover:text-[#c9a84c] transition-all"
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

// ── Member card ───────────────────────────────────────────────
interface CardProps {
  member: FamilyMember
  isSelected: boolean
  onClick: () => void
  cardRef: (el: HTMLDivElement | null) => void
}

function MemberCard({ member, isSelected, onClick, cardRef }: CardProps) {
  const c = gc(member.gender)
  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`w-[108px] rounded-2xl border-2 cursor-pointer transition-all duration-200 text-center select-none overflow-hidden ${
        isSelected ? 'scale-105' : 'hover:-translate-y-1'
      }`}
      style={{
        backgroundColor: c.bg,
        borderColor: isSelected ? '#c9a84c' : c.border,
        boxShadow: isSelected
          ? '0 0 0 3px rgba(201,168,76,0.2), 0 8px 24px rgba(0,0,0,0.4)'
          : '0 2px 12px rgba(0,0,0,0.3)',
      }}
    >
      {/* Top connector bar */}
      <div className="h-1 w-full" style={{ backgroundColor: c.border }} />

      <div className="p-3 pt-2.5">
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-full mx-auto mb-2 overflow-hidden border-2 flex items-center justify-center"
          style={{ borderColor: c.border }}
        >
          {member.photoUrl ? (
            <img src={getPhotoUrl(member.photoUrl)} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold" style={{ color: c.text, backgroundColor: c.bg }}>
              {member.name[0]}
            </div>
          )}
        </div>

        <p className="text-white text-[11px] font-semibold leading-tight line-clamp-2">{member.name}</p>
        {member.nickname && (
          <p className="text-[10px] mt-0.5 opacity-70" style={{ color: c.text }}>({member.nickname})</p>
        )}
        {(member.birthDate || member.deathDate) && (
          <p className="text-[9px] text-[#555] mt-1.5 leading-tight">
            {member.birthDate ? (member.isLunarBirth ? '🌙' : '') + member.birthDate : '?'}
            {member.deathDate ? ` – ${member.deathDate}` : ''}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────
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
      <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl w-full max-w-sm shadow-modal animate-slide-up overflow-hidden">
        <div className="h-1 w-full" style={{ backgroundColor: c.border }} />
        <div className="relative p-5 pb-4 border-b border-[#1a1a1a]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#666] hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 flex-shrink-0" style={{ borderColor: c.border }}>
              {member.photoUrl ? (
                <img src={getPhotoUrl(member.photoUrl)} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ color: c.text, backgroundColor: c.bg }}>
                  {member.name[0]}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">{member.name}</h3>
              {member.nickname && <p className="text-sm mt-0.5" style={{ color: c.text }}>"{member.nickname}"</p>}
              <p className="text-xs text-[#555] mt-1">
                {member.gender === 'male' ? '👨 Nam' : member.gender === 'female' ? '👩 Nữ' : '🧑 Khác'}
                {' · Thế hệ '}{member.generation}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {(member.birthDate || member.deathDate) && (
            <div className="flex gap-4 flex-wrap">
              {member.birthDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-[#52a852]" />
                  <span className="text-[#a0a0a0]">{member.isLunarBirth ? '🌙 ' : ''}{member.birthDate}</span>
                </div>
              )}
              {member.deathDate && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#e05252]">†</span>
                  <span className="text-[#a0a0a0]">{member.isLunarDeath ? '🌙 ' : ''}{member.deathDate}</span>
                </div>
              )}
            </div>
          )}

          {member.bio && (
            <div className="flex items-start gap-2">
              <Info size={14} className="text-[#555] mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#888] leading-relaxed">{member.bio}</p>
            </div>
          )}

          {(father || mother || spouses.length > 0 || children.length > 0) && (
            <div className="space-y-3 pt-2 border-t border-[#1a1a1a]">
              <p className="text-xs font-semibold text-[#444] uppercase tracking-wider">Quan hệ</p>

              {(father || mother) && (
                <div>
                  <p className="text-xs text-[#555] mb-1.5">Cha mẹ</p>
                  <div className="flex gap-2 flex-wrap">
                    {[father, mother].filter(Boolean).map(p => p && (
                      <button key={p.id} onClick={() => onSelect(p)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] hover:border-[#c9a84c]/30 transition-all">
                        <User size={11} className="text-[#555]" />
                        <span className="text-xs text-white">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {spouses.length > 0 && (
                <div>
                  <p className="text-xs text-[#555] mb-1.5">Vợ / Chồng</p>
                  <div className="flex flex-wrap gap-2">
                    {spouses.map(s => (
                      <button key={s.id} onClick={() => onSelect(s)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 border border-[#c9a84c]/20 hover:border-[#c9a84c]/40 transition-all">
                        <span className="text-[10px]">❤️</span>
                        <span className="text-xs text-white">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {children.length > 0 && (
                <div>
                  <p className="text-xs text-[#555] mb-1.5">Con cái ({children.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {children.map(ch => (
                      <button key={ch.id} onClick={() => onSelect(ch)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] hover:border-[#c9a84c]/30 transition-all">
                        <User size={11} className="text-[#555]" />
                        <span className="text-xs text-white">{ch.name}</span>
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
