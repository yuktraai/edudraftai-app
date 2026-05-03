import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const ALLOWED_LOGO_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const MAX_LOGO_BYTES    = 2 * 1024 * 1024 // 2 MB

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
}

// POST /api/college-pilot — public, submit college onboarding request
export async function POST(request) {
  try {
    let formData
    try {
      formData = await request.formData()
    } catch {
      return Response.json({ error: 'Invalid form data', code: 'PARSE_ERROR' }, { status: 400 })
    }

    const collegeName    = (formData.get('college_name')    ?? '').toString().trim()
    const address        = (formData.get('address')         ?? '').toString().trim()
    const district       = (formData.get('district')        ?? '').toString().trim()
    const state          = (formData.get('state')           ?? 'Odisha').toString().trim()
    const phone          = (formData.get('phone')           ?? '').toString().trim()
    const principalName  = (formData.get('principal_name')  ?? '').toString().trim()
    const principalEmail = (formData.get('principal_email') ?? '').toString().trim().toLowerCase()
    const departments    = formData.getAll('departments[]').map(d => d.toString().trim()).filter(Boolean)
    const lecturerEmails = (formData.get('lecturer_emails') ?? '').toString().trim()
    const logoFile       = formData.get('logo')

    // Validation
    const missing = []
    if (!collegeName)    missing.push('College name')
    if (!address)        missing.push('Address')
    if (!district)       missing.push('District')
    if (!phone)          missing.push('Phone')
    if (!principalName)  missing.push('Principal name')
    if (!principalEmail || !principalEmail.includes('@')) missing.push('Valid principal email')
    if (!departments.length) missing.push('At least one department')

    if (missing.length) {
      return Response.json(
        { error: `Missing required fields: ${missing.join(', ')}`, code: 'VALIDATION_ERROR' },
        { status: 422 }
      )
    }

    // Logo upload (optional)
    let logoPath = null

    if (logoFile && typeof logoFile !== 'string' && logoFile.size > 0) {
      if (!ALLOWED_LOGO_MIME.includes(logoFile.type)) {
        return Response.json(
          { error: 'Logo must be JPG, PNG, WebP or SVG', code: 'INVALID_FILE_TYPE' },
          { status: 422 }
        )
      }
      if (logoFile.size > MAX_LOGO_BYTES) {
        return Response.json(
          { error: 'Logo must be under 2 MB', code: 'FILE_TOO_LARGE' },
          { status: 422 }
        )
      }

      const timestamp   = Date.now()
      const sanitized   = sanitizeFilename(logoFile.name)
      const tempId      = crypto.randomUUID()
      logoPath          = `college-logos/${tempId}/${timestamp}_${sanitized}`

      const logoBuffer = await logoFile.arrayBuffer()
      const { error: uploadErr } = await adminSupabase
        .storage.from('college-logos')
        .upload(logoPath, logoBuffer, { contentType: logoFile.type, upsert: false })

      if (uploadErr) {
        logger.error('POST /api/college-pilot — logo upload failed', uploadErr)
        // Non-fatal — continue without logo
        logoPath = null
      }
    }

    // Insert record
    const { error: insertErr } = await adminSupabase
      .from('college_pilot_requests')
      .insert({
        college_name:    collegeName,
        address,
        district,
        state,
        phone,
        principal_name:  principalName,
        principal_email: principalEmail,
        departments,
        lecturer_emails: lecturerEmails || null,
        logo_path:       logoPath,
        status:          'new',
      })

    if (insertErr) {
      logger.error('POST /api/college-pilot — insert failed', insertErr)
      return Response.json(
        { error: 'Failed to save your request. Please try again.', code: 'DB_ERROR' },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (err) {
    logger.error('POST /api/college-pilot — unexpected', err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
