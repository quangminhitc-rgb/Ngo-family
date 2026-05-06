/**
 * PhotoGrid - Hiển thị danh sách ảnh dạng masonry grid
 */

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getPhotoUrl, formatDate } from '@/lib/utils'
import { Slideshow } from './Slideshow'
import { ImageIcon } from 'lucide-react'

interface Photo {
  id: string
  filename: string
  caption: string | null
  uploadedAt: string
  uploadedBy: { displayName: string }
}

export function PhotoGrid() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchPhotos(1)
  }, [])

  const fetchPhotos = async (pageNum: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/photos?page=${pageNum}&limit=24`)
      const data = await res.json()
      if (pageNum === 1) {
        setPhotos(data.photos)
      } else {
        setPhotos(prev => [...prev, ...data.photos])
      }
      setTotalPages(data.totalPages)
      setPage(pageNum)
    } catch (err) {
      console.error('Error fetching photos:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && photos.length === 0) {
    return (
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`skeleton rounded-xl break-inside-avoid ${
              i % 3 === 0 ? 'h-64' : i % 3 === 1 ? 'h-48' : 'h-56'
            }`}
          />
        ))}
      </div>
    )
  }

  if (!loading && photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
          <ImageIcon size={32} className="text-[#333]" />
        </div>
        <p className="text-[#666] text-lg">Chưa có ảnh nào</p>
        <p className="text-[#444] text-sm mt-1">Album sẽ được cập nhật sớm</p>
      </div>
    )
  }

  return (
    <>
      {/* Photo Grid - dạng masonry */}
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="break-inside-avoid group relative cursor-pointer rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#222] hover:border-[#c9a84c]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(201,168,76,0.1)]"
            onClick={() => setSelectedIndex(index)}
          >
            <div className="relative">
              <img
                src={getPhotoUrl(photo.filename)}
                alt={photo.caption ?? `Ảnh ${index + 1}`}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                {photo.caption && (
                  <p className="text-white text-xs font-medium leading-snug line-clamp-2">
                    {photo.caption}
                  </p>
                )}
                <p className="text-white/60 text-xs mt-1">
                  {formatDate(photo.uploadedAt)} · {photo.uploadedBy.displayName}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      {page < totalPages && (
        <div className="mt-8 text-center">
          <button
            onClick={() => fetchPhotos(page + 1)}
            disabled={loading}
            className="px-8 py-3 rounded-xl border border-[#333] text-[#a0a0a0] hover:border-[#c9a84c]/50 hover:text-[#c9a84c] transition-all duration-200 text-sm disabled:opacity-50"
          >
            {loading ? 'Đang tải...' : 'Tải thêm ảnh'}
          </button>
        </div>
      )}

      {/* Slideshow */}
      {selectedIndex !== null && (
        <Slideshow
          photos={photos}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  )
}
