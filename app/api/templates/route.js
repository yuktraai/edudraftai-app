import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'

const saveSchema = z.object({
  name:         z.string().min(1).max(60),
  content_type: z.enum(['lesson_notes', 'mcq_bank', 'question_bank', 'test_plan', 'exam_paper']),
  params:       z.record(z.unknown()),
})

export async function GET(request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await adminSupabase
      .from('users')
      .select('id, college_id, role, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return Response.json({ error: 'Profile not found', code: 'PROFILE_NOT_FOUND' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('content_type')

    let query = adminSupabase
      .from('generation_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    const { data: templates, error: fetchError } = await query

    if (fetchError) {
      console.error('[templates GET]', fetchError)
      return Response.json({ error: 'Failed to fetch templates', code: 'FETCH_ERROR' }, { status: 500 })
    }

    return Response.json({ templates: templates ?? [] })
  } catch (err) {
    console.error('[templates GET] unexpected', err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await adminSupabase
      .from('users')
      .select('id, college_id, role, is_active')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return Response.json({ error: 'Profile not found', code: 'PROFILE_NOT_FOUND' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = saveSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.errors[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const { name, content_type, params } = parsed.data

    const { data: template, error: insertError } = await adminSupabase
      .from('generation_templates')
      .insert({
        user_id:      user.id,
        college_id:   profile.college_id,
        name,
        content_type,
        params,
      })
      .select()
      .single()

    if (insertError) {
      // Unique constraint violation
      if (insertError.code === '23505') {
        return Response.json({ error: 'A template with that name already exists', code: 'DUPLICATE_NAME' }, { status: 409 })
      }
      console.error('[templates POST]', insertError)
      return Response.json({ error: 'Failed to save template', code: 'INSERT_ERROR' }, { status: 500 })
    }

    return Response.json({ template }, { status: 201 })
  } catch (err) {
    console.error('[templates POST] unexpected', err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
