import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

async function verifySuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('id, role').eq('id', user.id).single()
  return profile?.role === 'super_admin' ? { ...user, id: profile.id } : null
}

// POST /api/super-admin/copy-department
// Body: { src_college_id, src_dept_id, tgt_college_id, tgt_dept_id }
// Calls the copy_department Postgres function (see migration SQL)
export async function POST(request) {
  const user = await verifySuperAdmin()
  if (!user) return Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })

  try {
    const body = await request.json()
    const { src_college_id, src_dept_id, tgt_college_id, tgt_dept_id } = body

    if (!src_college_id || !src_dept_id || !tgt_college_id || !tgt_dept_id) {
      return Response.json(
        { error: 'Missing required fields: src_college_id, src_dept_id, tgt_college_id, tgt_dept_id', code: 'VALIDATION_ERROR' },
        { status: 422 }
      )
    }
    if (src_college_id === tgt_college_id && src_dept_id === tgt_dept_id) {
      return Response.json(
        { error: 'Source and target department cannot be the same', code: 'VALIDATION_ERROR' },
        { status: 422 }
      )
    }

    // Verify both colleges and both departments exist
    const [srcDept, tgtDept] = await Promise.all([
      adminSupabase.from('departments').select('id, name').eq('id', src_dept_id).eq('college_id', src_college_id).single(),
      adminSupabase.from('departments').select('id, name').eq('id', tgt_dept_id).eq('college_id', tgt_college_id).single(),
    ])

    if (srcDept.error || !srcDept.data) {
      return Response.json({ error: 'Source department not found', code: 'NOT_FOUND' }, { status: 404 })
    }
    if (tgtDept.error || !tgtDept.data) {
      return Response.json({ error: 'Target department not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    // Call the Postgres RPC function
    const { data: result, error: rpcErr } = await adminSupabase
      .rpc('copy_department', {
        p_src_college_id: src_college_id,
        p_src_dept_id:    src_dept_id,
        p_tgt_college_id: tgt_college_id,
        p_tgt_dept_id:    tgt_dept_id,
        p_performed_by:   user.id,
      })

    if (rpcErr) {
      logger.error('POST /api/super-admin/copy-department — rpc error', rpcErr)
      return Response.json(
        { error: 'Copy operation failed: ' + (rpcErr.message ?? 'Unknown error'), code: 'RPC_ERROR' },
        { status: 500 }
      )
    }

    return Response.json({
      success:         true,
      subjects_copied: result?.subjects_copied ?? 0,
      chunks_copied:   result?.chunks_copied   ?? 0,
      src_dept_name:   srcDept.data.name,
      tgt_dept_name:   tgtDept.data.name,
    })
  } catch (err) {
    logger.error('POST /api/super-admin/copy-department — unexpected', err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
