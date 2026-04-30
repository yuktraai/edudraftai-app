import { notFound } from 'next/navigation'
import Link from 'next/link'
import { adminSupabase } from '@/lib/supabase/admin'
import { JobForm } from '../../JobForm'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Edit Job Posting — EduDraftAI' }

export default async function EditJobPage({ params }) {
  const { id } = params

  const { data: job, error } = await adminSupabase
    .from('job_postings')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !job) notFound()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/super-admin/careers" className="hover:text-navy transition-colors">Careers</Link>
        <span>/</span>
        <span className="text-navy font-medium truncate max-w-xs">{job.title}</span>
        <span>/</span>
        <span className="text-navy font-medium">Edit</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Edit Job Posting</h1>
        <p className="text-sm text-muted mt-0.5">
          Changes are live immediately after saving.{' '}
          {!job.is_active && (
            <span className="text-warning font-medium">This posting is currently inactive.</span>
          )}
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <JobForm initialData={job} jobId={id} />
      </div>
    </div>
  )
}
