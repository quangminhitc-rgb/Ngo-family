import { createClient } from '@supabase/supabase-js'

const BUCKET = 'family-photos'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key)
}

export async function uploadToStorage(
  folder: 'photos' | 'members' | 'backgrounds',
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const supabase = getSupabase()
  const path = `${folder}/${filename}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteFromStorage(publicUrl: string): Promise<void> {
  try {
    const supabase = getSupabase()
    const marker = `/object/public/${BUCKET}/`
    const idx = publicUrl.indexOf(marker)
    if (idx === -1) return
    const storagePath = publicUrl.slice(idx + marker.length)
    await supabase.storage.from(BUCKET).remove([storagePath])
  } catch {
    // non-fatal — DB record deletion is more important
  }
}
