'use client'

/**
 * Trang THỬ NGHIỆM: album ảnh dùng react-photo-album + yet-another-react-lightbox.
 * - /album/beta        → ảnh thật từ /api/albums và /api/photos
 * - /album/beta?demo=1 → ảnh demo, không cần database
 * Trang cũ /album không bị thay đổi.
 */

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { MasonryPhotoAlbum, RowsPhotoAlbum } from 'react-photo-album'
import Lightbox from 'yet-another-react-lightbox'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'react-photo-album/rows.css'
import 'react-photo-album/masonry.css'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/captions.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import { Navbar } from '@/components/ui/Navbar'
import { getPhotoUrl } from '@/lib/utils'
import { DEMO_ALBUMS, DEMO_PHOTOS } from '@/lib/demo-data'
import { Image as ImageIcon } from 'lucide-react'

interface AlbumInfo { id: string; name: string }
interface Pic {
  src: string
  width: number
  height: number
  alt: string
  description?: string
  albumId: string | null
}

const FALLBACK = { width: 1600, height: 1200 } // ảnh cũ chưa có kích thước → coi như 4:3

function BetaAlbum() {
  const demo = useSearchParams().get('demo') === '1'
  const [albums, setAlbums] = useState<AlbumInfo[]>([])
  const [pics, setPics] = useState<Pic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [albumId, setAlbumId] = useState<string>('all')
  const [layout, setLayout] = useState<'masonry' | 'rows'>('masonry')
  const [index, setIndex] = useState(-1)

  useEffect(() => {
    if (demo) {
      setAlbums(DEMO_ALBUMS)
      setPics(DEMO_PHOTOS.map(p => ({ src: p.src, width: p.width, height: p.height, alt: p.caption, description: p.caption, albumId: p.albumId })))
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const [a, p] = await Promise.all([
          fetch('/api/albums').then(r => r.json()),
          fetch('/api/photos?page=1&limit=120').then(r => r.json()),
        ])
        if (!p.photos) throw new Error('no data')
        setAlbums((a.albums ?? []).map((x: any) => ({ id: x.id, name: x.name })))
        setPics(
          p.photos.map((x: any) => ({
            src: getPhotoUrl(x.filename),
            width: x.width || FALLBACK.width,
            height: x.height || FALLBACK.height,
            alt: x.caption || x.originalName || '',
            description: x.caption || undefined,
            albumId: x.albumId ?? null,
          })),
        )
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [demo])

  const shown = useMemo(
    () => (albumId === 'all' ? pics : pics.filter(p => p.albumId === albumId)),
    [pics, albumId],
  )

  const Album = layout === 'masonry' ? MasonryPhotoAlbum : RowsPhotoAlbum

  const chip = (active: boolean) => ({
    background: active ? 'var(--accent-bg)' : 'var(--surface-2)',
    border: `1px solid ${active ? 'var(--accent-bd)' : 'var(--border-2)'}`,
    color: active ? 'var(--accent)' : 'var(--text-2)',
  })

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <main className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        <div className="mb-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-3"
            style={{ border: '1px solid var(--accent-bd)', background: 'var(--accent-bg)', color: 'var(--accent)' }}
          >
            <ImageIcon size={14} /> Album ảnh · bản thử
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>Album Gia Đình</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-3)' }}>
            {demo ? 'Đang xem ảnh demo. ' : ''}
            <Link href="/album" className="underline">Xem bản hiện tại</Link>
            {' · '}
            <Link href={demo ? '/album/beta' : '/album/beta?demo=1'} className="underline">
              {demo ? 'Dùng ảnh thật' : 'Xem ảnh demo'}
            </Link>
          </p>
        </div>

        {/* Bộ lọc album + kiểu bố cục */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <button className="px-3 py-1.5 rounded-full text-sm" style={chip(albumId === 'all')} onClick={() => setAlbumId('all')}>
            Tất cả
          </button>
          {albums.map(a => (
            <button key={a.id} className="px-3 py-1.5 rounded-full text-sm" style={chip(albumId === a.id)} onClick={() => setAlbumId(a.id)}>
              {a.name}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button className="px-3 py-1.5 rounded-lg text-sm" style={chip(layout === 'masonry')} onClick={() => setLayout('masonry')}>Masonry</button>
            <button className="px-3 py-1.5 rounded-lg text-sm" style={chip(layout === 'rows')} onClick={() => setLayout('rows')}>Hàng đều</button>
          </div>
        </div>

        {loading ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={`skeleton rounded-xl break-inside-avoid ${i % 3 === 0 ? 'h-64' : i % 3 === 1 ? 'h-48' : 'h-56'}`} />
            ))}
          </div>
        ) : error || shown.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
            {error ? 'Không tải được ảnh (chưa kết nối database?). ' : 'Chưa có ảnh nào. '}
            Thử <Link href="/album/beta?demo=1" className="underline" style={{ color: 'var(--accent)' }}>ảnh demo</Link>.
          </div>
        ) : (
          <Album
            photos={shown}
            spacing={8}
            columns={(w: number) => (w < 500 ? 2 : w < 900 ? 3 : 4)}
            targetRowHeight={(w: number) => (w < 500 ? 140 : 220)}
            sizes={{ size: '1168px', sizes: [{ viewport: '(max-width: 1200px)', size: 'calc(100vw - 32px)' }] }}
            onClick={({ index: i }: { index: number }) => setIndex(i)}
          />
        )}

        <Lightbox
          open={index >= 0}
          index={index}
          close={() => setIndex(-1)}
          slides={shown}
          plugins={[Captions, Fullscreen, Slideshow, Thumbnails, Zoom]}
          captions={{ descriptionTextAlign: 'center' }}
          thumbnails={{ width: 80, height: 56, gap: 8 }}
          animation={{ swipe: 250 }}
          controller={{ closeOnBackdropClick: true }}
        />
      </main>
    </div>
  )
}

export default function AlbumBetaPage() {
  return (
    <Suspense fallback={null}>
      <BetaAlbum />
    </Suspense>
  )
}
