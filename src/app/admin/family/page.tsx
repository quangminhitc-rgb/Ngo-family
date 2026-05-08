'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, Trash2, X, Check, User, Upload, Search, Network } from 'lucide-react'
import { getPhotoUrl } from '@/lib/utils'
import type { FamilyMember, AddChildDefaults } from '@/components/family/FamilyTree'
import dynamic from 'next/dynamic'

const FamilyTree = dynamic(
  () => import('@/components/family/FamilyTree').then(m => ({ default: m.FamilyTree })),
  { ssr: false }
)

interface MemberForm {
  name: string
  nickname: string
  gender: string
  birthDate: string
  isLunarBirth: boolean
  deathDate: string
  isLunarDeath: boolean
  bio: string
  generation: number
  orderInGen: number
  fatherId: string
  motherId: string
  spouseIds: string[]
  photo: File | null
}

const emptyForm: MemberForm = {
  name: '', nickname: '', gender: 'male',
  birthDate: '', isLunarBirth: false,
  deathDate: '', isLunarDeath: false,
  bio: '', generation: 1, orderInGen: 0,
  fatherId: '', motherId: '', spouseIds: [],
  photo: null,
}

const GENDER_OPTIONS = [
  { value: 'male',   label: '👨 Nam' },
  { value: 'female', label: '👩 Nữ' },
  { value: 'other',  label: '🧑 Khác' },
]

const GC = {
  male:   '#3b82f6',
  female: '#ec4899',
  other:  '#8b5cf6',
}

export default function AdminFamilyPage() {
  const [members, setMembers]           = useState<FamilyMember[]>([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [form, setForm]                 = useState<MemberForm>(emptyForm)
  const [saving, setSaving]             = useState(false)
  const [saveError, setSaveError]       = useState<string | null>(null)
  const [search, setSearch]             = useState('')
  const [tab, setTab]                   = useState<'list' | 'tree'>('list')
  const photoInputRef                   = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => { fetchMembers() }, [])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/family')
      const data = await res.json()
      setMembers(data.members ?? [])
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm({ ...emptyForm })
    setPhotoPreview(null)
    setEditingMember(null)
    setSaveError(null)
    setShowForm(true)
  }

  const openEdit = (member: FamilyMember) => {
    const spouseIds: string[] = (() => {
      try { return JSON.parse(member.spouseIds) } catch { return [] }
    })()
    setForm({
      name: member.name,
      nickname: member.nickname ?? '',
      gender: member.gender,
      birthDate: member.birthDate ?? '',
      isLunarBirth: member.isLunarBirth,
      deathDate: member.deathDate ?? '',
      isLunarDeath: member.isLunarDeath,
      bio: member.bio ?? '',
      generation: member.generation,
      orderInGen: member.orderInGen,
      fatherId: member.fatherId ?? '',
      motherId: member.motherId ?? '',
      spouseIds,
      photo: null,
    })
    setPhotoPreview(member.photoUrl ? getPhotoUrl(member.photoUrl) : null)
    setEditingMember(member)
    setSaveError(null)
    setShowForm(true)
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setForm(f => ({ ...f, photo: file }))
    setPhotoPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      const fd = new FormData()
      fd.append('name', form.name.trim())
      fd.append('nickname', form.nickname)
      fd.append('gender', form.gender)
      fd.append('birthDate', form.birthDate)
      fd.append('isLunarBirth', String(form.isLunarBirth))
      fd.append('deathDate', form.deathDate)
      fd.append('isLunarDeath', String(form.isLunarDeath))
      fd.append('bio', form.bio)
      fd.append('generation', String(form.generation))
      fd.append('orderInGen', String(form.orderInGen))
      fd.append('fatherId', form.fatherId)
      fd.append('motherId', form.motherId)
      fd.append('spouseIds', JSON.stringify(form.spouseIds))
      if (form.photo) fd.append('photo', form.photo)

      const url    = editingMember ? `/api/family/${editingMember.id}` : '/api/family'
      const method = editingMember ? 'PATCH' : 'POST'
      const res    = await fetch(url, { method, body: fd })
      const json   = await res.json()
      if (res.ok) {
        setShowForm(false)
        fetchMembers()
      } else {
        setSaveError(json.error ?? `Lỗi ${res.status}`)
      }
    } catch (e: any) {
      setSaveError(e.message ?? 'Không thể kết nối server')
    } finally {
      setSaving(false)
    }
  }

  const handleAddChild = (defaults: AddChildDefaults) => {
    setForm({
      ...emptyForm,
      fatherId: defaults.fatherId ?? '',
      motherId: defaults.motherId ?? '',
      generation: defaults.generation,
    })
    setPhotoPreview(null)
    setEditingMember(null)
    setSaveError(null)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa thành viên này?')) return
    const res = await fetch(`/api/family/${id}`, { method: 'DELETE' })
    if (res.ok) setMembers(prev => prev.filter(m => m.id !== id))
  }

  const toggleSpouse = (id: string) => {
    setForm(f => ({
      ...f,
      spouseIds: f.spouseIds.includes(id)
        ? f.spouseIds.filter(s => s !== id)
        : [...f.spouseIds, id],
    }))
  }

  const filteredMembers = search.trim()
    ? members.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.nickname ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : members

  const otherMembers = members.filter(m => (!editingMember || m.id !== editingMember.id))

  const parentGen = form.generation - 1
  const fatherCandidates = otherMembers.filter(m => m.generation === parentGen && (m.gender === 'male'   || m.gender === 'other'))
  const motherCandidates = otherMembers.filter(m => m.generation === parentGen && (m.gender === 'female' || m.gender === 'other'))

  const parseSpouseIds = (raw: string): string[] => { try { return JSON.parse(raw) } catch { return [] } }

  const handleFatherChange = (fatherId: string) => {
    const update: Partial<typeof form> = { fatherId }
    if (fatherId) {
      const father = otherMembers.find(m => m.id === fatherId)
      if (father) {
        const fSpIds = parseSpouseIds(father.spouseIds)
        // Check both directions: father lists her, OR she lists father
        const spouse = otherMembers.find(m =>
          (m.gender === 'female' || m.gender === 'other') &&
          (fSpIds.includes(m.id) || parseSpouseIds(m.spouseIds).includes(fatherId))
        )
        if (spouse) update.motherId = spouse.id
      }
    }
    setForm(f => ({ ...f, ...update }))
  }

  const handleMotherChange = (motherId: string) => {
    const update: Partial<typeof form> = { motherId }
    if (motherId) {
      const mother = otherMembers.find(m => m.id === motherId)
      if (mother) {
        const mSpIds = parseSpouseIds(mother.spouseIds)
        // Check both directions: mother lists him, OR he lists mother
        const spouse = otherMembers.find(m =>
          (m.gender === 'male' || m.gender === 'other') &&
          (mSpIds.includes(m.id) || parseSpouseIds(m.spouseIds).includes(motherId))
        )
        if (spouse) update.fatherId = spouse.id
      }
    }
    setForm(f => ({ ...f, ...update }))
  }

  // ── Shared input/select style helpers ──
  const inputStyle: React.CSSProperties = {
    background: 'var(--surface-2)',
    border: '1px solid var(--border-2)',
    color: 'var(--text-1)',
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Cây gia phả</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{members.length} thành viên</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab toggle */}
          <div className="flex rounded-xl p-1" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <button
              onClick={() => setTab('list')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={tab === 'list'
                ? { background: 'var(--surface-2)', color: 'var(--text-1)' }
                : { color: 'var(--text-3)' }}
            >
              <User size={14} />
              Danh sách
            </button>
            <button
              onClick={() => setTab('tree')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={tab === 'tree'
                ? { background: 'var(--surface-2)', color: 'var(--text-1)' }
                : { color: 'var(--text-3)' }}
            >
              <Network size={14} />
              Xem cây
            </button>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{ background: 'var(--accent)', color: '#0f0f0f' }}
          >
            <Plus size={17} />
            Thêm thành viên
          </button>
        </div>
      </div>

      {/* ── Tree view ── */}
      {tab === 'tree' && (
        <div className="rounded-2xl p-6 min-h-[60vh]"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          {loading ? (
            <div className="flex items-center justify-center h-60" style={{ color: 'var(--text-3)' }}>
              Đang tải...
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 text-2xl"
                style={{ background: 'var(--surface-2)' }}>🌳</div>
              <p style={{ color: 'var(--text-3)' }}>Chưa có thành viên nào</p>
              <button onClick={openCreate} className="mt-4 text-sm hover:underline"
                style={{ color: 'var(--accent)' }}>
                + Thêm thành viên đầu tiên
              </button>
            </div>
          ) : (
            <FamilyTree members={members} onAddChild={handleAddChild} onEdit={openEdit} />
          )}
        </div>
      )}

      {/* ── List view ── */}
      {tab === 'list' && (
        <>
          {/* Search */}
          <div className="relative mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
              style={{ ...inputStyle }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 text-2xl"
                style={{ background: 'var(--surface-2)' }}>🌳</div>
              <p style={{ color: 'var(--text-3)' }}>
                {search ? 'Không tìm thấy kết quả' : 'Chưa có thành viên nào'}
              </p>
              {!search && (
                <button onClick={openCreate} className="mt-4 text-sm hover:underline"
                  style={{ color: 'var(--accent)' }}>
                  + Thêm thành viên đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(
                filteredMembers.reduce<Record<number, FamilyMember[]>>((acc, m) => {
                  if (!acc[m.generation]) acc[m.generation] = []
                  acc[m.generation].push(m)
                  return acc
                }, {})
              )
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([gen, genMembers]) => (
                  <div key={gen}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-3"
                      style={{ color: 'var(--text-3)' }}>
                      Thế hệ {gen}
                    </h3>
                    <div className="space-y-2">
                      {genMembers.map(member => {
                        const spouseIds: string[] = (() => {
                          try { return JSON.parse(member.spouseIds) } catch { return [] }
                        })()
                        const genderInfo = GENDER_OPTIONS.find(g => g.value === member.gender)
                        const genderColor = GC[member.gender as keyof typeof GC] ?? '#8b5cf6'
                        return (
                          <div key={member.id}
                            className="flex items-center gap-4 p-4 rounded-xl group transition-all"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center border-2"
                              style={{ borderColor: genderColor, background: `${genderColor}15` }}>
                              {member.photoUrl ? (
                                <img src={getPhotoUrl(member.photoUrl)} alt={member.name} className="w-full h-full object-cover" />
                              ) : (
                                <User size={16} style={{ color: genderColor }} />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate" style={{ color: 'var(--text-1)' }}>{member.name}</p>
                                {member.nickname && (
                                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>({member.nickname})</span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs" style={{ color: 'var(--text-3)' }}>
                                <span>{genderInfo?.label}</span>
                                {member.birthDate && <span>🎂 {member.birthDate}</span>}
                                {spouseIds.length > 0 && (
                                  <span className="truncate max-w-[160px]">❤️ {spouseIds.map(sid => members.find(m => m.id === sid)?.name ?? '?').join(', ')}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEdit(member)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(member.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                style={{ background: 'rgba(224,82,82,0.1)', color: 'var(--danger)' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {/* ── Create / Edit modal ── */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={e => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="rounded-2xl w-full max-w-lg shadow-lg animate-slide-up my-8"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>
                {editingMember ? 'Sửa thành viên' : 'Thêm thành viên mới'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Photo + Name */}
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}
                  onClick={() => photoInputRef.current?.click()}
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1" style={{ color: 'var(--text-3)' }}>
                      <Upload size={20} />
                      <span className="text-[10px]">Ảnh</span>
                    </div>
                  )}
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Họ và tên *"
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
                  />
                  <input
                    type="text"
                    value={form.nickname}
                    onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
                    placeholder="Tên thường gọi (tuỳ chọn)"
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
                  />
                </div>
              </div>

              {/* Gender + Generation + Order */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                    Giới tính
                  </label>
                  <select
                    value={form.gender}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={inputStyle}
                  >
                    {GENDER_OPTIONS.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                    Thế hệ
                  </label>
                  <input
                    type="number" min={1}
                    value={form.generation}
                    onChange={e => setForm(f => ({ ...f, generation: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                    Thứ tự
                  </label>
                  <input
                    type="number" min={0}
                    value={form.orderInGen}
                    onChange={e => setForm(f => ({ ...f, orderInGen: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Birth date */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Ngày sinh</label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <div
                      onClick={() => setForm(f => ({ ...f, isLunarBirth: !f.isLunarBirth, birthDate: '' }))}
                      className="w-8 h-4 rounded-full transition-all relative"
                      style={{ background: form.isLunarBirth ? '#7c7ccc' : 'var(--border-2)' }}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${form.isLunarBirth ? 'left-4' : 'left-0.5'}`} />
                    </div>
                    <span className="text-xs" style={{ color: '#7c7ccc' }}>🌙 Âm lịch</span>
                  </label>
                </div>
                {form.isLunarBirth ? (
                  <input
                    type="text"
                    value={form.birthDate}
                    onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
                    placeholder="VD: 10/07/1980 (ngày âm)"
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ ...inputStyle, borderColor: 'rgba(124,124,204,0.4)' }}
                  />
                ) : (
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={inputStyle}
                  />
                )}
              </div>

              {/* Death date */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                    Ngày mất (nếu có)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <div
                      onClick={() => setForm(f => ({ ...f, isLunarDeath: !f.isLunarDeath, deathDate: '' }))}
                      className="w-8 h-4 rounded-full transition-all relative"
                      style={{ background: form.isLunarDeath ? '#7c7ccc' : 'var(--border-2)' }}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${form.isLunarDeath ? 'left-4' : 'left-0.5'}`} />
                    </div>
                    <span className="text-xs" style={{ color: '#7c7ccc' }}>🌙 Âm lịch</span>
                  </label>
                </div>
                {form.isLunarDeath ? (
                  <input
                    type="text"
                    value={form.deathDate}
                    onChange={e => setForm(f => ({ ...f, deathDate: e.target.value }))}
                    placeholder="VD: 15/01/2010 (ngày âm)"
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ ...inputStyle, borderColor: 'rgba(124,124,204,0.4)' }}
                  />
                ) : (
                  <input
                    type="date"
                    value={form.deathDate}
                    onChange={e => setForm(f => ({ ...f, deathDate: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={inputStyle}
                  />
                )}
              </div>

              {/* Parents */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                    Cha <span className="normal-case opacity-60">(thế hệ {parentGen})</span>
                  </label>
                  <select
                    value={form.fatherId}
                    onChange={e => handleFatherChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={inputStyle}
                  >
                    <option value="">— Không có —</option>
                    {fatherCandidates.length === 0 && parentGen >= 1 && (
                      <option disabled value="">Chưa có thành viên thế hệ {parentGen}</option>
                    )}
                    {fatherCandidates.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                    Mẹ <span className="normal-case opacity-60">(thế hệ {parentGen})</span>
                  </label>
                  <select
                    value={form.motherId}
                    onChange={e => handleMotherChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={inputStyle}
                  >
                    <option value="">— Không có —</option>
                    {motherCandidates.length === 0 && parentGen >= 1 && (
                      <option disabled value="">Chưa có thành viên thế hệ {parentGen}</option>
                    )}
                    {motherCandidates.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Spouses */}
              {otherMembers.length > 0 && (
                <div>
                  <label className="block text-xs mb-2 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                    Vợ / Chồng
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {otherMembers.map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleSpouse(m.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all"
                        style={form.spouseIds.includes(m.id)
                          ? { background: 'var(--accent-bg)', borderColor: 'var(--accent-bd)', color: 'var(--accent)' }
                          : { background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-3)' }}
                      >
                        {form.spouseIds.includes(m.id) ? '❤️' : <User size={10} />}
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio */}
              <div>
                <label className="block text-xs mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                  Tiểu sử
                </label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Viết đôi dòng về thành viên này..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
                />
              </div>
            </div>

            {/* Error */}
            {saveError && (
              <div className="mx-5 mb-3 px-3 py-2.5 rounded-xl text-sm flex items-center gap-2"
                style={{ background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)', color: 'var(--danger)' }}>
                <X size={14} className="flex-shrink-0" />
                {saveError}
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm transition-all"
                style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
                style={{ background: 'var(--accent)', color: '#0f0f0f' }}
              >
                {saving
                  ? <div className="w-4 h-4 border-2 border-black/30 border-t-black/80 rounded-full animate-spin" />
                  : <Check size={15} />}
                {editingMember ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
