/**
 * Utility functions dùng chung
 */

/**
 * Format ngày giờ theo chuẩn Việt Nam
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('vi-VN', options ?? {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Format ngày tháng dài hơn: "15 tháng 3, 2025"
 */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format kích thước file thành chuỗi dễ đọc
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Tạo URL cho ảnh từ filename
 */
export function getPhotoUrl(filename: string): string {
  if (!filename) return ''
  if (filename.startsWith('http') || filename.startsWith('/uploads/')) return filename
  return `/uploads/${filename}`
}

/**
 * Tên tháng tiếng Việt
 */
export const MONTHS_VI = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
]

/**
 * Tên thứ tiếng Việt (viết tắt)
 */
export const DAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

/**
 * Label loại sự kiện
 */
export const EVENT_TYPES: Record<string, { label: string; color: string; emoji: string }> = {
  birthday:    { label: 'Sinh nhật',   color: '#52a852', emoji: '🎂' },
  anniversary: { label: 'Kỷ niệm',    color: '#e05252', emoji: '❤️' },
  reunion:     { label: 'Họp mặt',    color: '#c9a84c', emoji: '👨‍👩‍👧‍👦' },
  other:       { label: 'Sự kiện khác', color: '#7c7ccc', emoji: '📌' },
}

/**
 * Trả về class CSS màu theo type sự kiện
 */
export function getEventColor(type: string): string {
  return EVENT_TYPES[type]?.color ?? EVENT_TYPES.other.color
}
