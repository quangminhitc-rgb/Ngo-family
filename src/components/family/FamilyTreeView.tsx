'use client'

/**
 * FamilyTreeView — cây gia phả toàn cảnh (bản thử).
 *  - 3 chế độ: Toàn cảnh / Tổ tiên / Hậu duệ
 *  - Thu gọn / mở rộng nhánh (hiện "N người"), tự thu gọn khi cây lớn
 *  - Tìm kiếm theo tên, zoom bằng cuộn chuột / chụm 2 ngón, kéo để di chuyển
 *  - Bấm vào thẻ để xem chi tiết
 * Bố cục tính trong src/lib/family-layout.ts (tự viết, không dùng thư viện vẽ cây).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  X, Search, ZoomIn, ZoomOut, Maximize, Minimize, Eye, ArrowUpFromLine, ArrowDownToLine,
  ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Calendar, Package,
} from 'lucide-react'
import { getPhotoUrl } from '@/lib/utils'
import type { FamilyMember } from './FamilyTree'
import {
  CARD_H, CARD_W, LABEL_W, ancestorChain, buildModel, layoutTree,
  type LayoutNode,
} from '@/lib/family-layout'

type Mode = 'full' | 'ancestors' | 'descendants'
interface View { x: number; y: number; k: number }

const MIN_K = 0.2
const MAX_K = 2.2
const AUTO_COLLAPSE_FROM = 40 // cây có nhiều hơn số người này thì tự thu gọn các đời sâu
const AUTO_COLLAPSE_DEPTH = 2

const GENDER_COLOR: Record<string, string> = {
  male: '#3b82f6',
  female: '#ec4899',
  other: '#8b5cf6',
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

const initials = (name: string) => {
  const w = name.trim().split(/\s+/)
  return ((w[0]?.[0] ?? '') + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase()
}

const yearOf = (d: string | null) => (d && /^\d{4}/.test(d) ? d.slice(0, 4) : null)

export function FamilyTreeView({ members, height = 680 }: { members: FamilyMember[]; height?: number }) {
  const model = useMemo(() => buildModel(members), [members])

  const [mode, setMode] = useState<Mode>('full')
  const [focusUnit, setFocusUnit] = useState<string | null>(null) // unit làm tâm cho chế độ tổ tiên/hậu duệ
  const [override, setOverride] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<FamilyMember | null>(null)
  const [highlight, setHighlight] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [fs, setFs] = useState(false)

  const wrapRef = useRef<HTMLDivElement>(null)
  const vpRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 })
  const viewRef = useRef(view)
  viewRef.current = view
  const pendingFocus = useRef<{ id: string; k?: number } | 'fit' | null>('fit')
  const dragMoved = useRef(false)

  // dữ liệu đổi → đặt lại trạng thái
  useEffect(() => {
    setOverride({})
    setMode('full')
    setFocusUnit(null)
    setHighlight(null)
    pendingFocus.current = 'fit'
  }, [model])

  // ── Tính layout theo chế độ ──────────────────────────────────
  const layout = useMemo(() => {
    const big = model.total > AUTO_COLLAPSE_FROM
    let rootIds = model.roots
    let only: Set<string> | null = null
    let collapse = (id: string, depth: number) =>
      id in override ? override[id] : mode === 'full' && big && depth >= AUTO_COLLAPSE_DEPTH

    if (mode !== 'full' && focusUnit && model.units.has(focusUnit)) {
      if (mode === 'descendants') {
        rootIds = [focusUnit]
        collapse = (id: string) => (id in override ? override[id] : false)
      } else {
        const chain = ancestorChain(model, focusUnit)
        rootIds = [chain[0]]
        only = new Set(chain)
        collapse = () => false
      }
    }
    return layoutTree(model, { rootIds, isCollapsed: collapse, only })
  }, [model, mode, focusUnit, override])

  // ── Thao tác khung nhìn ─────────────────────────────────────
  const vpSize = () => {
    const r = vpRef.current?.getBoundingClientRect()
    return { w: r?.width ?? 800, h: r?.height ?? height }
  }

  /** smart=true: cây quá rộng thì mở ở cỡ đọc được, canh vào người gốc; smart=false: thu nhỏ vừa cả cây. */
  const fit = useCallback((smart = false) => {
    const { w, h } = vpSize()
    const k = Math.max(MIN_K, Math.min(1, w / layout.width, h / layout.height))
    if (smart && k < 0.6) {
      const root = layout.nodes[0]
      const kk = w < 700 ? 0.8 : 0.75
      setView({ k: kk, x: w / 2 - (root?.cx ?? layout.width / 2) * kk, y: 24 })
      return
    }
    setView({ k, x: (w - layout.width * k) / 2, y: Math.max(8, (h - layout.height * k) / 2) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, height])

  const centerOn = useCallback((unitId: string, k?: number) => {
    const n = layout.nodeById.get(unitId)
    if (!n) return
    const { w, h } = vpSize()
    const kk = k ?? Math.max(viewRef.current.k, 0.9)
    setView({ k: kk, x: w / 2 - n.cx * kk, y: h / 2 - (n.y + CARD_H / 2) * kk })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout])

  // sau mỗi lần layout đổi: thực hiện yêu cầu "fit"/"focus" đang chờ
  useEffect(() => {
    const p = pendingFocus.current
    if (!p) return
    pendingFocus.current = null
    if (p === 'fit') fit(true)
    else centerOn(p.id, p.k)
  }, [layout, fit, centerOn])

  // khung đổi kích thước (xoay màn hình, fullscreen) → vừa khung lại
  const lastSize = useRef<{ w: number; h: number } | null>(null)
  useEffect(() => {
    if (!vpRef.current) return
    const ro = new ResizeObserver(entries => {
      const r = entries[0].contentRect
      const prev = lastSize.current
      lastSize.current = { w: r.width, h: r.height }
      // lần quan sát đầu tiên chỉ ghi nhận kích thước; chỉ vừa khung lại khi kích thước thật sự đổi
      if (prev && (Math.abs(prev.w - r.width) > 1 || Math.abs(prev.h - r.height) > 1)) fit(true)
    })
    ro.observe(vpRef.current)
    return () => ro.disconnect()
  }, [fit])

  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const zoomAt = (factor: number, cx?: number, cy?: number) => {
    const v = viewRef.current
    const { w, h } = vpSize()
    const px = cx ?? w / 2
    const py = cy ?? h / 2
    const k2 = Math.min(MAX_K, Math.max(MIN_K, v.k * factor))
    const r = k2 / v.k
    setView({ k: k2, x: px - (px - v.x) * r, y: py - (py - v.y) * r })
  }

  // cuộn chuột để zoom (listener không-passive để chặn cuộn trang)
  useEffect(() => {
    const el = vpRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // kéo + chụm
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ dist: number; mx: number; my: number } | null>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    dragMoved.current = false
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values())
      gesture.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }
    }
    const move = (ev: PointerEvent) => {
      const prev = pointers.current.get(ev.pointerId)
      if (!prev) return
      const cur = { x: ev.clientX, y: ev.clientY }
      pointers.current.set(ev.pointerId, cur)
      const rect = vpRef.current!.getBoundingClientRect()
      if (pointers.current.size === 1) {
        const dx = cur.x - prev.x
        const dy = cur.y - prev.y
        if (dx !== 0 || dy !== 0) {
          dragMoved.current = dragMoved.current || Math.abs(dx) + Math.abs(dy) > 2
          setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }))
        }
      } else if (pointers.current.size === 2 && gesture.current) {
        const [a, b] = Array.from(pointers.current.values())
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        const mx = (a.x + b.x) / 2
        const my = (a.y + b.y) / 2
        const g = gesture.current
        dragMoved.current = true
        const v = viewRef.current
        const k2 = Math.min(MAX_K, Math.max(MIN_K, v.k * (dist / g.dist)))
        const r = k2 / v.k
        const px = g.mx - rect.left
        const py = g.my - rect.top
        // zoom quanh tâm 2 ngón + tịnh tiến theo chuyển động của tâm
        setView({
          k: k2,
          x: px - (px - v.x) * r + (mx - g.mx),
          y: py - (py - v.y) * r + (my - g.my),
        })
        gesture.current = { dist, mx, my }
      }
    }
    const up = (ev: PointerEvent) => {
      pointers.current.delete(ev.pointerId)
      if (pointers.current.size < 2) gesture.current = null
      if (pointers.current.size === 0) {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        window.removeEventListener('pointercancel', up)
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  // ── Hành động ───────────────────────────────────────────────
  const unitIdOf = (memberId: string) => model.unitOfMember.get(memberId)!

  /** Mở các nhánh đang thu gọn trên đường từ gốc tới unit này. */
  const revealUnit = (unitId: string) => {
    const chain = ancestorChain(model, unitId)
    setOverride(o => {
      const n = { ...o }
      chain.slice(0, -1).forEach(id => (n[id] = false))
      return n
    })
  }

  const goFocus = (m: FamilyMember, newMode: Mode = 'full') => {
    const uid = unitIdOf(m.id)
    setHighlight(m.id)
    setFocusUnit(uid)
    setMode(newMode)
    if (newMode === 'full') revealUnit(uid)
    pendingFocus.current = newMode === 'full' ? { id: uid } : 'fit'
    setSelected(null)
    setQuery('')
  }

  const toggle = (n: LayoutNode) =>
    setOverride(o => ({ ...o, [n.unit.id]: !n.collapsed }))

  const collapseAll = () => {
    const o: Record<string, boolean> = {}
    model.units.forEach((_, id) => {
      if (id !== model.roots[0] && (model.childUnits.get(id)?.length ?? 0) > 0) o[id] = true
    })
    pendingFocus.current = 'fit'
    setOverride(o)
  }
  const expandAll = () => {
    const o: Record<string, boolean> = {}
    model.units.forEach((_, id) => (o[id] = false))
    pendingFocus.current = 'fit'
    setOverride(o)
  }

  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else wrapRef.current?.requestFullscreen?.()
  }

  const matches = useMemo(() => {
    const q = norm(query.trim())
    if (!q) return []
    return members
      .filter(m => norm(m.name).includes(q) || (m.nickname && norm(m.nickname).includes(q)))
      .slice(0, 7)
  }, [query, members])

  const memberName = (id: string | null) => (id ? model.byId.get(id)?.name : undefined)
  const modeLabel = mode === 'ancestors' ? 'Tổ tiên' : 'Hậu duệ'
  const focusMember = focusUnit ? model.units.get(focusUnit)?.primary : null

  const btn = 'inline-flex items-center justify-center rounded-lg text-sm transition-colors'
  const btnStyle: React.CSSProperties = {
    background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-1)',
  }

  return (
    <div
      ref={wrapRef}
      className="flex flex-col"
      style={{ background: fs ? 'var(--bg)' : undefined, height: fs ? '100vh' : undefined, padding: fs ? 12 : 0 }}
    >
      {/* Thanh công cụ */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="inline-flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-2)' }}>
          {([
            ['full', 'Toàn cảnh', Eye],
            ['ancestors', 'Tổ tiên', ArrowUpFromLine],
            ['descendants', 'Hậu duệ', ArrowDownToLine],
          ] as const).map(([m, label, Icon]) => {
            const active = mode === m
            return (
              <button
                key={m}
                onClick={() => {
                  if (m === 'full') {
                    setMode('full'); pendingFocus.current = 'fit'
                  } else {
                    const target = focusUnit ?? model.roots[0]
                    setFocusUnit(target); setMode(m); pendingFocus.current = 'fit'
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm"
                style={{
                  background: active ? 'var(--text-1)' : 'var(--surface-2)',
                  color: active ? 'var(--surface)' : 'var(--text-2)',
                }}
              >
                <Icon size={14} /> {label}
              </button>
            )
          })}
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm kiếm tên…"
            className="text-sm rounded-lg pl-8 pr-3 py-1.5 w-44 sm:w-56 outline-none"
            style={btnStyle}
          />
          {matches.length > 0 && (
            <div
              className="absolute z-30 mt-1 w-64 rounded-lg overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', boxShadow: 'var(--shadow-lg)' }}
            >
              {matches.map(m => (
                <button
                  key={m.id}
                  onClick={() => goFocus(m)}
                  className="w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:opacity-80"
                  style={{ color: 'var(--text-1)', borderBottom: '1px solid var(--border)' }}
                >
                  <span>{m.name}</span>
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>Đời {m.generation}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button className={`${btn} w-8 h-8`} style={btnStyle} title="Thu gọn tất cả" onClick={collapseAll}><ChevronsDownUp size={15} /></button>
          <button className={`${btn} w-8 h-8`} style={btnStyle} title="Mở rộng tất cả" onClick={expandAll}><ChevronsUpDown size={15} /></button>
          <button className={`${btn} w-8 h-8`} style={btnStyle} title="Phóng to" onClick={() => zoomAt(1.25)}><ZoomIn size={15} /></button>
          <button className={`${btn} w-8 h-8`} style={btnStyle} title="Thu nhỏ" onClick={() => zoomAt(0.8)}><ZoomOut size={15} /></button>
          <button className={`${btn} w-8 h-8`} style={btnStyle} title="Vừa khung" onClick={() => fit(false)}><Maximize size={15} /></button>
          <button className={`${btn} w-8 h-8`} style={btnStyle} title="Toàn màn hình" onClick={toggleFs}>
            {fs ? <Minimize size={15} /> : <Maximize size={15} style={{ transform: 'rotate(45deg)' }} />}
          </button>
        </div>
      </div>

      {mode !== 'full' && focusMember && (
        <div className="mb-2 text-sm" style={{ color: 'var(--text-2)' }}>
          {modeLabel} của <b style={{ color: 'var(--text-1)' }}>{focusMember.name}</b>
          {' · '}
          <button className="underline" onClick={() => { setMode('full'); pendingFocus.current = 'fit' }}>Xem toàn cảnh</button>
        </div>
      )}

      {/* Khung vẽ */}
      <div
        ref={vpRef}
        onPointerDown={onPointerDown}
        className="relative overflow-hidden rounded-xl select-none"
        style={{
          height: fs ? undefined : `min(${height}px, 72vh)`,
          flex: fs ? 1 : undefined,
          touchAction: 'none',
          cursor: 'grab',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            position: 'absolute', left: 0, top: 0,
            width: layout.width, height: layout.height,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
            transformOrigin: '0 0',
          }}
        >
          {/* nhãn đời */}
          {layout.levels.map(l => (
            <div
              key={l.depth}
              className="absolute text-[11px] font-medium rounded-md px-2 py-0.5"
              style={{
                left: 8, top: l.y + CARD_H / 2 - 11, width: LABEL_W - 12, textAlign: 'center',
                background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--text-3)',
              }}
            >
              Đời {l.generation}
            </div>
          ))}

          {/* đường nối */}
          <svg className="absolute left-0 top-0 pointer-events-none" width={layout.width} height={layout.height} style={{ overflow: 'visible' }}>
            {layout.linkPaths.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="var(--border-2)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {layout.spousePaths.map((d, i) => (
              <path key={`s${i}`} d={d} fill="none" stroke="var(--accent)" strokeWidth={2} opacity={0.7} />
            ))}
          </svg>

          {/* thẻ thành viên */}
          {layout.nodes.map(n => (
            <React.Fragment key={n.unit.id}>
              {n.unit.members.map((m, i) => (
                <PersonCard
                  key={m.id}
                  m={m}
                  x={n.cardXs[i]}
                  y={n.y}
                  isMain={i === 0}
                  highlighted={highlight === m.id}
                  onClick={() => { if (!dragMoved.current) { setSelected(m); setHighlight(m.id) } }}
                />
              ))}
              {n.hasChildren && (
                <button
                  onClick={e => { e.stopPropagation(); if (!dragMoved.current) toggle(n) }}
                  title={n.collapsed ? 'Mở rộng nhánh' : 'Thu gọn nhánh'}
                  className="absolute flex items-center justify-center rounded-full"
                  style={{
                    left: n.cx - 10, top: n.y + CARD_H - 10, width: 20, height: 20,
                    background: 'var(--surface)', border: '1px solid var(--border-2)', color: 'var(--text-2)',
                    zIndex: 2,
                  }}
                >
                  {n.collapsed ? <ChevronRight size={12} style={{ transform: 'rotate(90deg)' }} /> : <ChevronDown size={12} />}
                </button>
              )}
            </React.Fragment>
          ))}

          {/* ô tóm tắt nhánh đã thu gọn */}
          {layout.summaries.map(s => (
            <button
              key={s.parentId}
              onClick={() => { if (!dragMoved.current) setOverride(o => ({ ...o, [s.parentId]: false })) }}
              className="absolute flex items-center gap-2 rounded-xl text-left px-3"
              style={{
                left: s.cx - CARD_W / 2, top: s.y, width: CARD_W, height: CARD_H - 16, marginTop: 8,
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.5)', color: 'var(--text-1)',
              }}
            >
              <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.9)', color: '#fff' }}>
                <Package size={16} />
              </span>
              <span className="leading-tight">
                <span className="block text-[13px] font-semibold">{s.count} người</span>
                <span className="block text-[11px]" style={{ color: 'var(--text-3)' }}>
                  Đời {s.gens[0]}→{s.gens[1]} · bấm để mở
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="absolute left-2 bottom-2 text-[11px] px-2 py-0.5 rounded-md pointer-events-none"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
          {Math.round(view.k * 100)}% · {layout.nodes.reduce((s, n) => s + n.unit.members.length, 0)}/{model.total} người
        </div>
        <div className="absolute right-2 bottom-2 text-[11px] pointer-events-none hidden sm:block" style={{ color: 'var(--text-3)' }}>
          Cuộn để zoom · Kéo để di chuyển · Bấm thẻ để xem chi tiết
        </div>
      </div>

      {/* Chú thích */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-5 text-xs" style={{ color: 'var(--text-3)' }}>
        <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-full inline-block" style={{ background: GENDER_COLOR.male }} /> Nam</span>
        <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-full inline-block" style={{ background: GENDER_COLOR.female }} /> Nữ</span>
        <span className="flex items-center gap-1.5"><i className="w-6 h-0.5 inline-block" style={{ background: 'var(--accent)' }} /> Vợ/Chồng</span>
        <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm inline-block" style={{ background: 'rgba(245,158,11,0.5)' }} /> Nhánh thu gọn</span>
      </div>

      {/* Chi tiết */}
      {selected && (
        <Detail
          m={selected}
          father={memberName(selected.fatherId)}
          mother={memberName(selected.motherId)}
          spouses={model.units.get(unitIdOf(selected.id))!.members.filter(x => x.id !== selected.id).map(x => x.name)}
          children={members.filter(x => x.fatherId === selected.id || x.motherId === selected.id).map(x => x.name)}
          onClose={() => setSelected(null)}
          onAncestors={() => goFocus(selected, 'ancestors')}
          onDescendants={() => goFocus(selected, 'descendants')}
          onLocate={() => goFocus(selected, 'full')}
        />
      )}
    </div>
  )
}

// ── Thẻ thành viên ───────────────────────────────────────────────
function PersonCard({
  m, x, y, isMain, highlighted, onClick,
}: { m: FamilyMember; x: number; y: number; isMain: boolean; highlighted: boolean; onClick: () => void }) {
  const color = GENDER_COLOR[m.gender] ?? GENDER_COLOR.other
  const by = yearOf(m.birthDate)
  const dy = yearOf(m.deathDate)
  const dead = !!m.deathDate
  const years = by ? (dy ? `${by} – ${dy}` : dead ? `${by} – ?` : by) : dy ? `? – ${dy}` : ''
  return (
    <button
      onClick={onClick}
      className="absolute flex items-center gap-2.5 text-left rounded-xl px-2.5"
      style={{
        left: x, top: y, width: CARD_W, height: CARD_H,
        background: 'var(--surface)',
        border: `1.5px solid ${highlighted ? 'var(--accent)' : 'var(--border-2)'}`,
        borderLeft: `4px solid ${color}`,
        boxShadow: highlighted ? '0 0 0 3px var(--accent-bg), var(--shadow)' : 'var(--shadow)',
        opacity: dead ? 0.82 : 1,
      }}
    >
      {m.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={getPhotoUrl(m.photoUrl)} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" draggable={false} />
      ) : (
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
          style={{ background: color + '26', color }}
        >
          {initials(m.name)}
        </span>
      )}
      <span className="min-w-0 leading-tight">
        <span
          className="block text-[13px] font-semibold overflow-hidden"
          style={{ color: 'var(--text-1)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
        >
          {m.name}
        </span>
        <span className="flex items-center gap-1.5 mt-1 text-[10.5px] whitespace-nowrap" style={{ color: 'var(--text-3)' }}>
          <span className="px-1.5 rounded" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
            Đời {m.generation}
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: dead ? 'var(--text-3)' : 'var(--success)' }} />
            {dead ? 'Đã mất' : 'Còn sống'}
          </span>
        </span>
        {years && (
          <span className="block text-[10.5px] mt-0.5" style={{ color: 'var(--text-3)' }}>
            {isMain ? '' : '♥ '}{years}
          </span>
        )}
      </span>
    </button>
  )
}

// ── Cửa sổ chi tiết ──────────────────────────────────────────────
function Detail({
  m, father, mother, spouses, children, onClose, onAncestors, onDescendants, onLocate,
}: {
  m: FamilyMember
  father?: string
  mother?: string
  spouses: string[]
  children: string[]
  onClose: () => void
  onAncestors: () => void
  onDescendants: () => void
  onLocate: () => void
}) {
  const row = (label: string, value?: string | string[]) =>
    value && (Array.isArray(value) ? value.length > 0 : true) ? (
      <div className="flex gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
        <span className="w-20 shrink-0" style={{ color: 'var(--text-3)' }}>{label}</span>
        <span>{Array.isArray(value) ? value.join(', ') : value}</span>
      </div>
    ) : null

  const act = 'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left'
  const actStyle: React.CSSProperties = { background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-1)' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 relative max-h-[88vh] overflow-y-auto"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', boxShadow: 'var(--shadow-lg)' }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg" style={{ color: 'var(--text-3)' }} aria-label="Đóng">
          <X size={18} />
        </button>
        <div className="flex items-center gap-4">
          {m.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getPhotoUrl(m.photoUrl)} alt={m.name} className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
              {initials(m.name)}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-1)' }}>{m.name}</h3>
            {m.nickname && <p className="text-sm" style={{ color: 'var(--text-3)' }}>({m.nickname})</p>}
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
              Đời {m.generation} · {m.deathDate ? 'Đã mất' : 'Còn sống'}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          {(m.birthDate || m.deathDate) && (
            <div className="flex gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
              <Calendar size={15} className="mt-0.5 shrink-0" />
              <div>
                {m.birthDate && <div>Sinh: {m.isLunarBirth ? '🌙 ' : ''}{m.birthDate}</div>}
                {m.deathDate && <div>Mất: {m.isLunarDeath ? '🌙 ' : ''}{m.deathDate}</div>}
              </div>
            </div>
          )}
          {row('Cha', father)}
          {row('Mẹ', mother)}
          {row('Vợ/Chồng', spouses)}
          {row('Con', children)}
          {m.bio && <p className="pt-2 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{m.bio}</p>}
        </div>

        <div className="mt-4 space-y-2">
          <button className={act} style={actStyle} onClick={onDescendants}><ArrowDownToLine size={15} /> Xem hậu duệ</button>
          <button className={act} style={actStyle} onClick={onAncestors}><ArrowUpFromLine size={15} /> Xem tổ tiên</button>
          <button className={act} style={actStyle} onClick={onLocate}><Eye size={15} /> Định vị trên toàn cảnh</button>
        </div>
      </div>
    </div>
  )
}
