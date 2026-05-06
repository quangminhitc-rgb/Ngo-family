'use client'

/**
 * Trang Album ảnh - Public
 * Hiển thị danh sách album → click vào album → xem ảnh trong album
 */

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/ui/Navbar'
import { Slideshow } from '@/components/album/Slideshow'
import { Image as ImageIcon, FolderOpen, ArrowLeft, ChevronRight, User, Calendar } from 'lucide-react'
import { getPhotoUrl, formatDate } from '@/lib/utils'

interface Album {
  id: string
  name: string
  description: string | null
  coverPhotoId: string | null
  displayDate: string | null
  isDefault: boolean
  createdBy: { displayName: string }
  _count: { photos: number }
  photos: { filename: string }[]
}

interface Photo {
  id: string
  filename: string
  caption: string | null
  takenAt: string | null
  uploadedAt: string
  uploadedBy: { displayName: string }
}

export default function AlbumPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loadingAlbums, setLoadingAlbums] = useState(true)

  // Currently opened album
  const [openAlbum, setOpenAlbum] = useState<Album | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetch('/api/albums')
      .then(r => r.json())
      .then(d => setAlbums(d.albums ?? []))
      .catch(() => {})
      .finally(() => setLoadingAlbums(false))
  }, [])

  const handleOpenAlbum = async (album: Album, pageNum = 1) => {
    setOpenAlbum(album)
    setLoadingPhotos(true)
    try {
      const albumParam = album.isDefault ? 'none' : album.id
      const res = await fetch(`/api/photos?albumId=${albumParam}&page=${pageNum}&limit=24`)
      const data = await res.json()
      if (pageNum === 1) setPhotos(data.photos ?? [])
      else setPhotos(prev => [...prev, ...(data.photos ?? [])])
      setTotalPages(data.totalPages ?? 1)
      setPage(pageNum)
    } finally {
      setLoadingPhotos(false)
    }
  }

  const handleBack = () => {
    setOpenAlbum(null)
    setPhotos([])
    setPage(1)
    setSelectedIndex(null)
  }

  // ── Album List View ───────────────────────────────────────
  if (!openAlbum) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <Navbar />
        <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#c9a84c] text-sm font-medium mb-4">
              <ImageIcon size={14} />
              Album ảnh
            </div>
            <h1 className="text-4xl font-bold text-white">Khoảnh khắc gia đình</h1>
            <p className="text-[#666] mt-3 max-w-md mx-auto">
              Những hình ảnh đẹp nhất được lưu giữ qua từng năm tháng
            </p>
          </div>

          {loadingAlbums ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton rounded-2xl h-64" />
              ))}
            </div>
          ) : albums.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
                <FolderOpen size={32} className="text-[#333]" />
              </div>
              <p className="text-[#666] text-lg">Chưa có album nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {albums.map(album => {
                const coverFilename = album.coverPhotoId ?? album.photos[0]?.filename
                const photoCount = album._count.photos
                const displayDate = album.displayDate
                  ? new Date(album.displayDate).getFullYear()
                  : null

                return (
                  <button
                    key={album.id}
                    onClick={() => handleOpenAlbum(album)}
                    className="group relative rounded-2xl overflow-hidden bg-[#111] border border-[#1a1a1a] hover:border-[#c9a84c]/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(201,168,76,0.12)] text-left"
                  >
                    {/* Cover photo */}
                    <div className="aspect-[4/3] bg-[#1a1a1a] relative overflow-hidden">
                      {coverFilename ? (
                        <img
                          src={getPhotoUrl(coverFilename)}
                          alt={album.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FolderOpen size={40} className="text-[#2a2a2a]" />
                        </div>
                      )}
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      {/* Photo count badge */}
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium border border-white/10">
                        {photoCount} ảnh
                      </div>

                      {/* Default badge */}
                      {album.isDefault && (
                        <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-[#c9a84c]/80 text-[#0f0f0f] text-[10px] font-bold uppercase">
                          Mặc định
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-white group-hover:text-[#c9a84c] transition-colors truncate">
                            {album.name}
                          </h3>
                          {album.description && (
                            <p className="text-[#555] text-sm mt-1 line-clamp-1">{album.description}</p>
                          )}
                        </div>
                        <ChevronRight size={16} className="text-[#333] group-hover:text-[#c9a84c] flex-shrink-0 mt-0.5 transition-colors" />
                      </div>

                      <div className="flex items-center gap-3 mt-3 text-xs text-[#444]">
                        <span className="flex items-center gap-1">
                          <User size={11} />
                          {album.createdBy.displayName}
                        </span>
                        {displayDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {displayDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </main>
      </div>
    )
  }

  // ── Single Album Photo View ───────────────────────────────
  const coverFilename = openAlbum.coverPhotoId ?? openAlbum.photos[0]?.filename

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navbar />
      <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        {/* Back + Album header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-[#666] hover:text-[#c9a84c] transition-colors mb-5 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Tất cả album
          </button>

          <div className="flex items-start gap-5">
            {/* Mini cover */}
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#1a1a1a] flex-shrink-0">
              {coverFilename ? (
                <img
                  src={getPhotoUrl(coverFilename)}
                  alt={openAlbum.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FolderOpen size={24} className="text-[#2a2a2a]" />
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white">{openAlbum.name}</h1>
              {openAlbum.description && (
                <p className="text-[#666] text-sm mt-1">{openAlbum.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-[#444]">
                <span>{openAlbum._count.photos} ảnh</span>
                <span>·</span>
                <span>{openAlbum.createdBy.displayName}</span>
                {openAlbum.displayDate && (
                  <>
                    <span>·</span>
                    <span>{new Date(openAlbum.displayDate).getFullYear()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Photos grid */}
        {loadingPhotos && photos.length === 0 ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={`skeleton rounded-xl break-inside-avoid ${i % 3 === 0 ? 'h-64' : i % 3 === 1 ? 'h-48' : 'h-56'}`} />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
              <ImageIcon size={32} className="text-[#333]" />
            </div>
            <p className="text-[#666] text-lg">Album chưa có ảnh</p>
          </div>
        ) : (
          <>
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="break-inside-avoid group relative cursor-pointer rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#222] hover:border-[#c9a84c]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(201,168,76,0.1)]"
                  onClick={() => setSelectedIndex(index)}
                >
                  <img
                    src={getPhotoUrl(photo.filename)}
                    alt={photo.caption ?? `Ảnh ${index + 1}`}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    {photo.caption && (
                      <p className="text-white text-xs font-medium leading-snug line-clamp-2">{photo.caption}</p>
                    )}
                    <p className="text-white/60 text-xs mt-1">
                      {formatDate(photo.takenAt ?? photo.uploadedAt)} · {photo.uploadedBy.displayName}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Load more */}
            {page < totalPages && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => handleOpenAlbum(openAlbum, page + 1)}
                  disabled={loadingPhotos}
                  className="px-8 py-3 rounded-xl border border-[#333] text-[#a0a0a0] hover:border-[#c9a84c]/50 hover:text-[#c9a84c] transition-all duration-200 text-sm disabled:opacity-50"
                >
                  {loadingPhotos ? 'Đang tải...' : 'Tải thêm ảnh'}
                </button>
              </div>
            )}
          </>
        )}

        {/* Slideshow */}
        {selectedIndex !== null && (
          <Slideshow
            photos={photos}
            initialIndex={selectedIndex}
            onClose={() => setSelectedIndex(null)}
          />
        )}
      </main>
    </div>
  )
}
