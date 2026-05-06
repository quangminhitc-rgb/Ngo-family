/**
 * Slideshow - Xem ảnh toàn màn hình với animation
 * Hỗ trợ: phím mũi tên, swipe mobile, nút close
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { getPhotoUrl, formatDate } from '@/lib/utils'

interface Photo {
  id: string
  filename: string
  caption: string | null
  uploadedAt: string
  uploadedBy: { displayName: string }
}

interface SlideshowProps {
  photos: Photo[]
  initialIndex: number
  onClose: () => void
}

export function Slideshow({ photos, initialIndex, onClose }: SlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Touch/swipe support
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)

  const goTo = useCallback((index: number, dir: 'left' | 'right') => {
    if (isAnimating) return
    setDirection(dir)
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentIndex(index)
      setDirection(null)
      setIsAnimating(false)
    }, 250)
  }, [isAnimating])

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      goTo(currentIndex + 1, 'left')
    } else {
      goTo(0, 'left')
    }
  }, [currentIndex, photos.length, goTo])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      goTo(currentIndex - 1, 'right')
    } else {
      goTo(photos.length - 1, 'right')
    }
  }, [currentIndex, photos.length, goTo])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goNext, goPrev, onClose])

  // Prevent scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext()
      else goPrev()
    }
  }

  const photo = photos[currentIndex]

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-[#1a1a1a]/80 hover:bg-[#c9a84c]/20 border border-[#333] hover:border-[#c9a84c]/40 flex items-center justify-center text-[#a0a0a0] hover:text-white transition-all duration-200"
      >
        <X size={18} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-[#1a1a1a]/80 border border-[#333] text-sm text-[#a0a0a0]">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Prev button */}
      <button
        onClick={goPrev}
        className="absolute left-4 z-10 w-11 h-11 rounded-full bg-[#1a1a1a]/80 hover:bg-[#c9a84c]/20 border border-[#333] hover:border-[#c9a84c]/40 flex items-center justify-center text-[#a0a0a0] hover:text-white transition-all duration-200"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Image */}
      <div
        className="flex-1 flex items-center justify-center px-16 py-16 h-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative max-w-5xl max-h-full transition-all duration-250"
          style={{
            opacity: isAnimating ? 0 : 1,
            transform: isAnimating
              ? `translateX(${direction === 'left' ? '-30px' : '30px'})`
              : 'translateX(0)',
          }}
        >
          <img
            src={getPhotoUrl(photo.filename)}
            alt={photo.caption ?? `Ảnh ${currentIndex + 1}`}
            className="max-w-full max-h-[calc(100vh-160px)] object-contain rounded-xl shadow-modal"
            style={{ maxWidth: 'min(900px, calc(100vw - 120px))' }}
          />

          {/* Caption */}
          {(photo.caption || photo.uploadedAt) && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-xl">
              {photo.caption && (
                <p className="text-white text-sm font-medium">{photo.caption}</p>
              )}
              <p className="text-white/50 text-xs mt-1">
                {formatDate(photo.uploadedAt)} · {photo.uploadedBy.displayName}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={goNext}
        className="absolute right-4 z-10 w-11 h-11 rounded-full bg-[#1a1a1a]/80 hover:bg-[#c9a84c]/20 border border-[#333] hover:border-[#c9a84c]/40 flex items-center justify-center text-[#a0a0a0] hover:text-white transition-all duration-200"
      >
        <ChevronRight size={20} />
      </button>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 px-4 overflow-x-auto scrollbar-hide">
          {photos.slice(Math.max(0, currentIndex - 4), Math.min(photos.length, currentIndex + 5)).map((p, i) => {
            const realIndex = Math.max(0, currentIndex - 4) + i
            return (
              <button
                key={p.id}
                onClick={() => goTo(realIndex, realIndex > currentIndex ? 'left' : 'right')}
                className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  realIndex === currentIndex
                    ? 'border-[#c9a84c] opacity-100'
                    : 'border-transparent opacity-40 hover:opacity-70'
                }`}
              >
                <img
                  src={getPhotoUrl(p.filename)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
