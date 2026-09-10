import { createClient } from '@/lib/supabase'

const BUCKETS = {
  pmu:      'pmu-photos',
  avatars:  'employee-avatars',
  receipts: 'expense-receipts',
} as const

type Bucket = keyof typeof BUCKETS

/**
 * Upload un fichier dans un bucket Supabase Storage
 * Retourne l'URL publique ou null si erreur
 */
export async function uploadFile(
  bucket: Bucket,
  path: string,
  file: File
): Promise<string | null> {
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(BUCKETS[bucket])
    .upload(path, file, { upsert: true, cacheControl: '3600' })

  if (error) { console.error('[UPLOAD]', error); return null }

  const { data } = supabase.storage.from(BUCKETS[bucket]).getPublicUrl(path)
  return data?.publicUrl || null
}

/**
 * Supprimer un fichier
 */
export async function deleteFile(bucket: Bucket, path: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKETS[bucket]).remove([path])
  return !error
}

/**
 * Extraire le path depuis une URL publique Supabase
 */
export function extractPath(url: string, bucket: Bucket): string {
  return url.split(`/${BUCKETS[bucket]}/`)[1] || ''
}

/**
 * Générer un nom de fichier unique
 */
export function uniqueFileName(original: string): string {
  const ext = original.split('.').pop() || 'jpg'
  return `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
}
