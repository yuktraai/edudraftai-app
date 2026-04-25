import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().min(1).max(60),
})

export async function PATCH(request, { params }) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.errors[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const { name } = parsed.data

    const { data: template, error: updateError } = await adminSupabase
      .from('generation_templates')
      .update({ name })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === '23505') {
        return Response.json({ error: 'A template with that name already exists', code: 'DUPLICATE_NAME' }, { status: 409 })
      }
      console.error('[templates PATCH]', updateError)
      return Response.json({ error: 'Failed to update template', code: 'UPDATE_ERROR' }, { status: 500 })
    }

    if (!template) {
      return Response.json({ error: 'Template not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    return Response.json({ template })
  } catch (err) {
    console.error('[templates PATCH] unexpected', err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { error: deleteError } = await adminSupabase
      .from('generation_templates')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('[templates DELETE]', deleteError)
      return Response.json({ error: 'Failed to delete template', code: 'DELETE_ERROR' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('[templates DELETE] unexpected', err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
