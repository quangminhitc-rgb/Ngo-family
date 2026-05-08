import fs from 'fs'
import path from 'path'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

export async function uploadToStorage(
  folder: 'photos' | 'members' | 'backgrounds',
  filename: string,
  buffer: Buffer,
): Promise<string> {
  const dir = path.join(UPLOADS_DIR, folder)
  ensureDir(dir)
  fs.writeFileSync(path.join(dir, filename), buffer)
  return `/uploads/${folder}/${filename}`
}

export async function deleteFromStorage(publicUrl: string): Promise<void> {
  try {
    if (!publicUrl.startsWith('/uploads/')) return
    const filePath = path.join(process.cwd(), 'public', publicUrl)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch {
    // non-fatal
  }
}
