import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED  = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const BUCKET   = 'college-logos'

export async function POST(request, { params }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const collegeId = params.id

    // Verify college exists
    const { data: college } = await adminSupabase
      .from('colleges')
      .select('id, logo_storage_path')
      .eq('id', collegeId)
      .single()

    if (!college) return Response.json({ error: 'College not found' }, { status: 404 })

    const formData = await request.formData()
    const file     = formData.get('file')

    if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

    if (!ALLOWED.includes(file.type)) {
      return Response.json({ error: 'Invalid file type. Use PNG, JPG, WebP, or SVG.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    if (buffer.length > MAX_SIZE) {
      return Response.json({ error: 'File too large. Maximum size is 2MB.' }, { status: 413 })
    }

    // Delete old logo if exists
    if (college.logo_storage_path) {
      await adminSupabase.storage.from(BUCKET).remove([college.logo_storage_path])
    }

    // Determine extension
    const ext = file.type === 'image/svg+xml' ? 'svg'
              : file.type === 'image/png'     ? 'png'
              : file.type === 'image/webp'    ? 'webp'
              : 'jpg'

    const storagePath = `${collegeId}/logo.${ext}`

    // Upload
    const { error: uploadError } = await adminSupabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: true })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = adminSupabase.storage.from(BUCKET).getPublicUrl(storagePath)

    // Update college record
    await adminSupabase
      .from('colleges')
      .update({ logo_url: publicUrl, logo_storage_path: storagePath })
      .eq('id', collegeId)

    return Response.json({ data: { logo_url: publicUrl } })
  } catch (err) {
    logger.error('[logo upload]', err)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
