import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = `EduDraftAI <${process.env.RESEND_FROM_EMAIL}>`

const ALLOWED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
}

// POST /api/careers/[id]/apply — public, submit application + upload resume
export async function POST(request, { params }) {
  const { id: jobId } = params

  try {
    // ── 1. Parse multipart/form-data ───────────────────────────────────────────
    let formData
    try {
      formData = await request.formData()
    } catch {
      return Response.json({ error: 'Invalid form data', code: 'PARSE_ERROR' }, { status: 400 })
    }

    const fullName    = (formData.get('full_name')    ?? '').toString().trim()
    const email       = (formData.get('email')        ?? '').toString().trim().toLowerCase()
    const phone       = (formData.get('phone')        ?? '').toString().trim()
    const currentRole = (formData.get('current_role') ?? '').toString().trim()
    const resumeFile  = formData.get('resume')

    // ── 2. Server-side validation ──────────────────────────────────────────────
    const errors = []
    if (!fullName)                errors.push('Full name is required')
    if (!email || !email.includes('@')) errors.push('Valid email is required')
    if (!phone)                   errors.push('Phone number is required')
    if (!resumeFile || typeof resumeFile === 'string') errors.push('Resume file is required')

    if (errors.length) {
      return Response.json({ error: errors.join('. '), code: 'VALIDATION_ERROR' }, { status: 422 })
    }

    // File type check
    const fileType = resumeFile.type
    if (!ALLOWED_MIME.includes(fileType)) {
      return Response.json(
        { error: 'Resume must be a PDF, DOC, or DOCX file', code: 'INVALID_FILE_TYPE' },
        { status: 422 }
      )
    }

    // File size check
    const fileBytes = resumeFile.size
    if (fileBytes > MAX_FILE_BYTES) {
      return Response.json(
        { error: 'Resume must be under 5 MB', code: 'FILE_TOO_LARGE' },
        { status: 422 }
      )
    }

    // ── 3. Verify job exists and is active ────────────────────────────────────
    const { data: job, error: jobErr } = await adminSupabase
      .from('job_postings')
      .select('id, title')
      .eq('id', jobId)
      .eq('is_active', true)
      .single()

    if (jobErr || !job) {
      return Response.json({ error: 'Job not found or no longer active', code: 'JOB_NOT_FOUND' }, { status: 404 })
    }

    // ── 4. Upload resume to Supabase Storage ──────────────────────────────────
    const timestamp       = Date.now()
    const sanitized       = sanitizeFilename(resumeFile.name)
    const storagePath     = `applications/${jobId}/${timestamp}_${sanitized}`

    const fileBuffer = await resumeFile.arrayBuffer()

    const { error: uploadError } = await adminSupabase
      .storage
      .from('resumes')
      .upload(storagePath, fileBuffer, {
        contentType: fileType,
        upsert:      false,
      })

    if (uploadError) {
      logger.error(`POST /api/careers/${jobId}/apply — storage upload failed`, uploadError)
      return Response.json(
        { error: 'Failed to upload resume. Please try again.', code: 'UPLOAD_ERROR' },
        { status: 500 }
      )
    }

    // ── 5. Insert application row ─────────────────────────────────────────────
    // Store the path (not a public URL — bucket is private)
    // resume_url stores the path itself; signed URLs are generated on demand
    const { error: insertError } = await adminSupabase
      .from('job_applications')
      .insert({
        job_id:       jobId,
        full_name:    fullName,
        email,
        phone,
        current_role: currentRole || null,
        resume_path:  storagePath,
        resume_url:   storagePath,  // same as path; signed URL generated per-request in admin API
        status:       'pending',
      })

    if (insertError) {
      logger.error(`POST /api/careers/${jobId}/apply — insert failed`, insertError)
      // Attempt to clean up uploaded file
      await adminSupabase.storage.from('resumes').remove([storagePath])
      return Response.json(
        { error: 'Failed to save application. Please try again.', code: 'INSERT_ERROR' },
        { status: 500 }
      )
    }

    // ── 6. Send confirmation email (non-blocking — failure must not block success) ─
    try {
      await resend.emails.send({
        from:    FROM,
        to:      email,
        subject: `We received your application — EduDraftAI`,
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Received</title>
</head>
<body style="margin:0;padding:0;background:#F4F7F6;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="background:#0D1F3C;border-radius:12px 12px 0 0;padding:28px 36px;">
              <span style="font-size:20px;font-weight:800;color:#00B4A6;letter-spacing:-0.5px;">EduDraftAI</span>
              <span style="font-size:12px;color:#718096;margin-left:8px;">by Yuktra AI</span>
            </td>
          </tr>
          <tr>
            <td style="background:#FFFFFF;padding:36px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
              <h2 style="margin:0 0 16px;font-size:22px;color:#0D1F3C;font-weight:700;">Thanks for applying, ${fullName}!</h2>
              <p style="margin:0 0 14px;font-size:15px;color:#4A5568;line-height:1.6;">
                We've received your application for the <strong style="color:#0D1F3C;">${job.title}</strong> position at Yuktra AI.
              </p>
              <p style="margin:0 0 14px;font-size:15px;color:#4A5568;line-height:1.6;">
                Our team will carefully review your profile and get back to you if your experience is a good match.
                We aim to respond to all applications within 5–7 business days.
              </p>
              <p style="margin:0;font-size:15px;color:#4A5568;line-height:1.6;">
                In the meantime, feel free to explore what we're building at
                <a href="https://edudraftai.com" style="color:#00B4A6;text-decoration:none;">edudraftai.com</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#FFFFFF;padding:0 36px 36px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;border-radius:0 0 12px 12px;">
              <p style="margin:0;font-size:14px;color:#718096;">
                Warm regards,<br/>
                <strong style="color:#0D1F3C;">The EduDraftAI Team</strong><br/>
                Yuktra AI · <a href="mailto:info@yuktraai.com" style="color:#00B4A6;text-decoration:none;">info@yuktraai.com</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <span style="font-size:12px;color:#A0AEC0;">© ${new Date().getFullYear()} Yuktra AI. All rights reserved.</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      })
    } catch (emailErr) {
      logger.error(`POST /api/careers/${jobId}/apply — email send failed (non-fatal)`, emailErr)
      // Do NOT return error — application was saved successfully
    }

    return Response.json({ success: true })
  } catch (err) {
    logger.error(`POST /api/careers/${jobId}/apply — unexpected`, err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
