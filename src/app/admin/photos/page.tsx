'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Upload, Trash2, Edit2, Check, X, Image, Plus, FolderOpen, Calendar, FolderPlus, Layers } from 'lucide-react'
import { getPhotoUrl, formatDate } from '@/lib/utils'

interface Album {
  id: string
  name: string
  isDefault: boolean
}

interface Photo {
  id: string
  filename: string
  originalName: string
  caption: string | null
  size: number
  uploadedAt: string
  takenAt: string | null
  albumId: string | null
  uploadedBy: { displayName: string }
  userId: string
  album: { id: string; name: string } | null
}

interface EditState {
  caption: string
  takenAt: string
  albumId: string
}

export default function AdminPhotosPage() {
  const { data: session } = useSession()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ caption: '', takenAt: '', albumId: '' })

  // Album filter: null = all, 'none' = no album, otherwise albumId
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null)

  // Upload state
  const [previewFiles, setPreviewFiles] = useState<{
    file: File; preview: string; caption: string; takenAt: string; albumId: string
  }[]>([])
  const [uploadAlbumId, setUploadAlbumId] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Album management modal
  const [showAlbumModal, setShowAlbumModal] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newAlbumDesc, setNewAlbumDesc] = useState('')
  const [savingAlbum, setSavingAlbum] = useState(false)

  useEffect(() => {
    fetchPhotos()
    fetchAlbums()
  }, [])

  const fetchPhotos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/photos?limit=500')
      const data = await res.json()
      setPhotos(data.photos ?? [])
    } finally {
      setLoading(false)
    }
  }

  const fetchAlbums = async () => {
    try {
      const res = await fetch('/api/albums')
      const data = await res.json()
      setAlbums(data.albums ?? [])
      const def = data.albums?.find((a: Album) => a.isDefault)
      if (def) setUploadAlbumId(def.id)
    } catch {}
  }

  // Derived counts & filtered list
  const albumCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    photos.forEach(p => {
      const key = p.albumId ?? 'none'
      counts[key] = (counts[key] ?? 0) + 1
    })
    return counts
  }, [photos])

  const filteredPhotos = useMemo(() => {
    if (selectedAlbum === null) return photos
    if (selectedAlbum === 'none') return photos.filter(p => !p.albumId)
    return photos.filter(p => p.albumId === selectedAlbum)
  }, [photos, selectedAlbum])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const previews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      caption: '',
      takenAt: '',
      albumId: uploadAlbumId,
    }))
    setPreviewFiles(prev => [...prev, ...previews])
    e.target.value = ''
  }

  const handleUpload = async () => {
    if (previewFiles.length === 0) return
    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      previewFiles.forEach(({ file, caption, takenAt, albumId }) => {
        formData.append('photos', file)
        formData.append('captions', caption)
        formData.append('takenAts', takenAt)
        formData.append('albumIds', albumId || uploadAlbumId)
      })
      const res = await fetch('/api/photos', { method: 'POST', body: formData })
      const json = await res.json()
      if (res.ok) {
        setPreviewFiles([])
        fetchPhotos()
      } else {
        setUploadError(json.error ?? `Lỗi ${res.status}`)
      }
    } catch (e: any) {
      setUploadError(e.message ?? 'Không thể kết nối server')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa ảnh này?')) return
    const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' })
    if (res.ok) setPhotos(prev => prev.filter(p => p.id !== id))
  }

  const openEdit = (photo: Photo) => {
    setEditingId(photo.id)
    setEditState({
      caption: photo.caption ?? '',
      takenAt: photo.takenAt ? new Date(photo.takenAt).toISOString().split('T')[0] : '',
      albumId: photo.albumId ?? '',
    })
  }

  const handleSaveEdit = async (id: string) => {
    const body: any = { caption: editState.caption }
    if (editState.takenAt) body.takenAt = editState.takenAt
    if (editState.albumId !== undefined) body.albumId = editState.albumId || null
    const res = await fetch(`/api/photos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const album = albums.find(a => a.id === editState.albumId) ?? null
      setPhotos(prev => prev.map(p => p.id === id ? {
        ...p,
        caption: editState.caption || null,
        takenAt: editState.takenAt ? new Date(editState.takenAt).toISOString() : null,
        albumId: editState.albumId || null,
        album: album ? { id: album.id, name: album.name } : null,
      } : p))
      setEditingId(null)
    }
  }

  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return
    setSavingAlbum(true)
    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAlbumName.trim(), description: newAlbumDesc.trim() || undefined }),
      })
      if (res.ok) {
        setNewAlbumName('')
        setNewAlbumDesc('')
        fetchAlbums()
      }
    } finally {
      setSavingAlbum(false)
    }
  }

  const handleDeleteAlbum = async (id: string, name: string) => {
    if (!confirm(`Xóa album "${name}"? Ảnh trong album sẽ không bị xóa.`)) return
    const res = await fetch(`/api/albums/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchAlbums()
      if (selectedAlbum === id) setSelectedAlbum(null)
    }
  }

  const canDelete = (photo: Photo) =>
    session?.user.role === 'admin' || photo.userId === session?.user.id

  const albumTabClass = (active: boolean) =>
    `w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left ${
      active
        ? 'bg-[#c9a84c]/15 text-[#c9a84c] font-medium'
        : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'
    }`

  const mobileTabClass = (active: boolean) =>
    `flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
      active
        ? 'bg-[#c9a84c]/15 text-[#c9a84c] border-[#c9a84c]/30'
        : 'bg-[#111] text-[#888] border-[#2a2a2a] hover:text-white hover:border-[#333]'
    }`

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý ảnh</h1>
          <p className="text-[#666] text-sm mt-1">{photos.length} ảnh · {albums.length} album</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAlbumModal(true)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-[#a0a0a0] text-sm hover:text-white hover:border-[#333] transition-all"
          >
            <FolderPlus size={16} />
            <span className="hidden sm:inline">Album</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c9a84c] text-[#0f0f0f] font-semibold text-sm hover:bg-[#d4b461] transition-all"
          >
            <Plus size={17} />
            Thêm ảnh
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />

      {/* Upload error */}
      {uploadError && (
        <div className="mb-4 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-sm"
          style={{ background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)', color: '#e05252' }}>
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="flex-shrink-0"><X size={14} /></button>
        </div>
      )}

      {/* Upload preview */}
      {previewFiles.length > 0 && (
        <div className="mb-6 p-5 rounded-2xl bg-[#111] border border-[#1a1a1a]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="font-semibold text-white">Xem trước ({previewFiles.length} ảnh)</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <FolderOpen size={14} className="text-[#666] flex-shrink-0" />
                <select
                  value={uploadAlbumId}
                  onChange={e => {
                    setUploadAlbumId(e.target.value)
                    setPreviewFiles(prev => prev.map(pf => ({ ...pf, albumId: e.target.value })))
                  }}
                  className="text-xs px-2 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#c9a84c]/40 max-w-[140px]"
                >
                  <option value="">Không có album</option>
                  {albums.map(a => (
                    <option key={a.id} value={a.id}>{a.name}{a.isDefault ? ' (mặc định)' : ''}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setPreviewFiles([])}
                className="px-3 py-1.5 rounded-lg text-sm text-[#666] hover:text-[#e05252] transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#c9a84c] text-[#0f0f0f] text-sm font-semibold hover:bg-[#d4b461] disabled:opacity-60 transition-all"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-[#0f0f0f]/50 border-t-[#0f0f0f] rounded-full animate-spin" />
                ) : <Upload size={15} />}
                Upload {previewFiles.length} ảnh
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {previewFiles.map((pf, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#222]">
                <img src={pf.preview} alt="" className="w-full aspect-square object-cover" />
                <div className="p-2 space-y-1.5">
                  <input
                    type="text"
                    value={pf.caption}
                    onChange={e => {
                      const updated = [...previewFiles]; updated[i].caption = e.target.value; setPreviewFiles(updated)
                    }}
                    placeholder="Caption (tuỳ chọn)"
                    className="w-full text-xs px-2 py-1.5 bg-[#111] border border-[#2a2a2a] rounded-lg text-white placeholder-[#444] focus:outline-none focus:border-[#c9a84c]/40"
                  />
                  <input
                    type="date"
                    value={pf.takenAt}
                    onChange={e => {
                      const updated = [...previewFiles]; updated[i].takenAt = e.target.value; setPreviewFiles(updated)
                    }}
                    className="w-full text-xs px-2 py-1.5 bg-[#111] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#c9a84c]/40 [color-scheme:dark]"
                  />
                </div>
                <button
                  onClick={() => setPreviewFiles(prev => prev.filter((_, j) => j !== i))}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main: sidebar + grid */}
      <div className="flex gap-5">

        {/* Desktop album sidebar */}
        <div className="hidden lg:block w-48 flex-shrink-0">
          <div className="sticky top-4 rounded-2xl bg-[#111] border border-[#1a1a1a] overflow-hidden">
            <div className="px-3 py-2.5 border-b border-[#1a1a1a]">
              <p className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Album</p>
            </div>
            <div className="p-2 space-y-0.5">
              <button
                onClick={() => setSelectedAlbum(null)}
                className={albumTabClass(selectedAlbum === null)}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Layers size={14} className="flex-shrink-0" />
                  <span className="truncate">Tất cả</span>
                </span>
                <span className="text-xs text-[#555] flex-shrink-0">{photos.length}</span>
              </button>
              {albums.map(album => (
                <button
                  key={album.id}
                  onClick={() => setSelectedAlbum(album.id)}
                  className={albumTabClass(selectedAlbum === album.id)}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <FolderOpen size={14} className="flex-shrink-0" />
                    <span className="truncate">{album.name}</span>
                  </span>
                  <span className="text-xs text-[#555] flex-shrink-0">{albumCounts[album.id] ?? 0}</span>
                </button>
              ))}
              {(albumCounts['none'] ?? 0) > 0 && (
                <button
                  onClick={() => setSelectedAlbum('none')}
                  className={albumTabClass(selectedAlbum === 'none')}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Image size={14} className="flex-shrink-0" />
                    <span className="truncate">Chưa phân loại</span>
                  </span>
                  <span className="text-xs text-[#555] flex-shrink-0">{albumCounts['none']}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">

          {/* Mobile horizontal filter */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            <button onClick={() => setSelectedAlbum(null)} className={mobileTabClass(selectedAlbum === null)}>
              Tất cả <span className="text-[#555]">{photos.length}</span>
            </button>
            {albums.map(album => (
              <button key={album.id} onClick={() => setSelectedAlbum(album.id)} className={mobileTabClass(selectedAlbum === album.id)}>
                {album.name} <span className="text-[#555]">{albumCounts[album.id] ?? 0}</span>
              </button>
            ))}
            {(albumCounts['none'] ?? 0) > 0 && (
              <button onClick={() => setSelectedAlbum('none')} className={mobileTabClass(selectedAlbum === 'none')}>
                Chưa phân loại <span className="text-[#555]">{albumCounts['none']}</span>
              </button>
            )}
          </div>

          {/* Current album label */}
          {selectedAlbum !== null && (
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-white">
                {selectedAlbum === 'none'
                  ? 'Chưa phân loại'
                  : albums.find(a => a.id === selectedAlbum)?.name ?? ''}
                <span className="ml-2 text-[#555] font-normal">{filteredPhotos.length} ảnh</span>
              </p>
              <button onClick={() => setSelectedAlbum(null)} className="text-xs text-[#555] hover:text-[#888]">
                Xem tất cả
              </button>
            </div>
          )}

          {/* Photo grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton rounded-xl aspect-square" />
              ))}
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
                <Image size={32} className="text-[#333]" />
              </div>
              <p className="text-[#666]">
                {selectedAlbum !== null ? 'Album này chưa có ảnh' : 'Chưa có ảnh nào'}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2a2a2a] text-sm text-[#a0a0a0] hover:text-[#c9a84c] hover:border-[#c9a84c]/30 transition-all"
              >
                <Plus size={15} /> Upload ảnh
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredPhotos.map(photo => (
                <div
                  key={photo.id}
                  className="group relative rounded-xl overflow-hidden bg-[#111] border border-[#1a1a1a] hover:border-[#2a2a2a] transition-all"
                >
                  <div className="aspect-square">
                    <img
                      src={getPhotoUrl(photo.filename)}
                      alt={photo.caption ?? ''}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Album badge — only when showing all */}
                  {selectedAlbum === null && photo.album && (
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white/70 backdrop-blur-sm max-w-[80%] truncate">
                      {photo.album.name}
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(photo)}
                        className="w-7 h-7 rounded-lg bg-[#1a1a1a]/80 flex items-center justify-center text-[#a0a0a0] hover:text-white transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                      {canDelete(photo) && (
                        <button
                          onClick={() => handleDelete(photo.id)}
                          className="w-7 h-7 rounded-lg bg-[#e05252]/20 flex items-center justify-center text-[#e05252] hover:bg-[#e05252]/40 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <div>
                      {photo.caption && (
                        <p className="text-white text-xs font-medium line-clamp-2">{photo.caption}</p>
                      )}
                      <p className="text-white/50 text-xs mt-0.5">
                        {formatDate(photo.takenAt ?? photo.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Edit overlay */}
                  {editingId === photo.id && (
                    <div className="absolute inset-0 bg-[#111]/97 flex flex-col justify-center p-3 gap-2 overflow-y-auto">
                      <p className="text-xs text-[#666] text-center font-medium">Chỉnh sửa ảnh</p>
                      <input
                        type="text"
                        value={editState.caption}
                        onChange={e => setEditState(s => ({ ...s, caption: e.target.value }))}
                        autoFocus
                        placeholder="Caption..."
                        className="text-xs px-2 py-1.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-[#444] focus:outline-none focus:border-[#c9a84c]/40"
                      />
                      <div className="flex items-center gap-1.5">
                        <Calendar size={11} className="text-[#555] flex-shrink-0" />
                        <input
                          type="date"
                          value={editState.takenAt}
                          onChange={e => setEditState(s => ({ ...s, takenAt: e.target.value }))}
                          className="flex-1 text-xs px-2 py-1.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#c9a84c]/40 [color-scheme:dark]"
                        />
                      </div>
                      <select
                        value={editState.albumId}
                        onChange={e => setEditState(s => ({ ...s, albumId: e.target.value }))}
                        className="text-xs px-2 py-1.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#c9a84c]/40"
                      >
                        <option value="">Không có album</option>
                        {albums.map(a => (
                          <option key={a.id} value={a.id}>{a.name}{a.isDefault ? ' (mặc định)' : ''}</option>
                        ))}
                      </select>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleSaveEdit(photo.id)}
                          className="flex-1 py-1.5 rounded-lg bg-[#c9a84c] text-[#0f0f0f] text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <Check size={12} /> Lưu
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex-1 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[#a0a0a0] text-xs flex items-center justify-center gap-1"
                        >
                          <X size={12} /> Hủy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Album management modal */}
      {showAlbumModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={e => e.target === e.currentTarget && setShowAlbumModal(false)}
        >
          <div className="bg-[#111] border border-[#1a1a1a] rounded-2xl w-full max-w-md shadow-modal animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
              <h3 className="font-semibold text-white">Quản lý album</h3>
              <button
                onClick={() => setShowAlbumModal(false)}
                className="w-7 h-7 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#666] hover:text-white transition-colors"
              >
                <X size={15} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={e => setNewAlbumName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateAlbum()}
                  placeholder="Tên album mới *"
                  className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#444] text-sm focus:outline-none focus:border-[#c9a84c]/40"
                />
                <input
                  type="text"
                  value={newAlbumDesc}
                  onChange={e => setNewAlbumDesc(e.target.value)}
                  placeholder="Mô tả (tuỳ chọn)"
                  className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-white placeholder-[#444] text-sm focus:outline-none focus:border-[#c9a84c]/40"
                />
                <button
                  onClick={handleCreateAlbum}
                  disabled={savingAlbum || !newAlbumName.trim()}
                  className="w-full py-2.5 rounded-xl bg-[#c9a84c] text-[#0f0f0f] font-semibold text-sm hover:bg-[#d4b461] disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                >
                  {savingAlbum ? (
                    <div className="w-4 h-4 border-2 border-[#0f0f0f]/50 border-t-[#0f0f0f] rounded-full animate-spin" />
                  ) : <Plus size={15} />}
                  Tạo album
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {albums.length === 0 ? (
                  <p className="text-center text-[#555] text-sm py-4">Chưa có album nào</p>
                ) : (
                  albums.map(album => (
                    <div
                      key={album.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1a1a] border border-[#222] group"
                    >
                      <FolderOpen size={16} className="text-[#c9a84c] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{album.name}</p>
                        <p className="text-[10px] text-[#555]">
                          {albumCounts[album.id] ?? 0} ảnh
                          {album.isDefault ? ' · Album mặc định' : ''}
                        </p>
                      </div>
                      {!album.isDefault && (
                        <button
                          onClick={() => handleDeleteAlbum(album.id, album.name)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#e05252] opacity-0 group-hover:opacity-100 hover:bg-[#e05252]/10 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
