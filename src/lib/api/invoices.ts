import { AppError, fromSupabaseError, unwrap } from '@/lib/errors'
import { supabase } from '@/lib/supabase'
import type { Invoice } from '@/types'

const BUCKET = 'facturas'
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED: Record<string, 'pdf' | 'xml'> = { pdf: 'pdf', xml: 'xml' }

export async function listInvoices(campaignId: string): Promise<Invoice[]> {
  return unwrap(
    await supabase
      .from('invoices')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false }),
  )
}

/**
 * Sube la factura y registra la fila. Si el insert falla se borra el objeto:
 * un archivo huérfano en Storage no aparecería en ningún lado y seguiría
 * consumiendo el gigabyte gratuito.
 */
export async function uploadInvoice(campaignId: string, file: File): Promise<Invoice> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const kind = ALLOWED[extension]

  if (!kind) {
    throw new AppError('VALIDATION', 'Solo se aceptan archivos PDF y XML.')
  }
  if (file.size > MAX_BYTES) {
    throw new AppError('VALIDATION', 'El archivo pesa más de 10 MB.')
  }

  const storagePath = `campaigns/${campaignId}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: kind === 'pdf' ? 'application/pdf' : 'application/xml',
    upsert: false,
  })
  if (uploadError) throw new AppError('STORAGE', 'No se pudo subir el archivo.', { cause: uploadError })

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      campaign_id: campaignId,
      kind,
      storage_path: storagePath,
      filename: file.name,
      size_bytes: file.size,
    })
    .select('*')
    .single()

  if (error || !data) {
    await supabase.storage.from(BUCKET).remove([storagePath])
    throw new AppError('STORAGE', 'Se subió el archivo pero no se pudo registrar. Inténtalo otra vez.', {
      cause: error,
    })
  }

  return data
}

/** URL firmada de una hora: el bucket es privado. */
export async function getSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600)
  if (error || !data) {
    throw new AppError('STORAGE', 'No se pudo abrir el archivo.', { cause: error })
  }
  return data.signedUrl
}

export async function deleteInvoice(invoice: Pick<Invoice, 'id' | 'storage_path'>): Promise<void> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([invoice.storage_path])
  if (storageError) {
    throw new AppError('STORAGE', 'No se pudo borrar el archivo.', { cause: storageError })
  }
  const { error } = await supabase.from('invoices').delete().eq('id', invoice.id)
  if (error) throw fromSupabaseError(error)
}

/** Logo de la cabecera del PDF; vive en la misma cubeta, carpeta `brand/`. */
export async function uploadBrandLogo(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  if (!['png', 'jpg', 'jpeg', 'svg'].includes(extension)) {
    throw new AppError('VALIDATION', 'El logo debe ser PNG, JPG o SVG.')
  }
  const storagePath = `brand/logo-${Date.now()}.${extension}`
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, { upsert: true })
  if (error) throw new AppError('STORAGE', 'No se pudo subir el logo.', { cause: error })
  return storagePath
}
