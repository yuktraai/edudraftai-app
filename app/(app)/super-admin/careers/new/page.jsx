import Link from 'next/link'
import { JobForm } from '../JobForm'

export const metadata = { title: 'Post New Job — EduDraftAI' }

export default function NewJobPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/super-admin/careers" className="hover:text-navy transition-colors">Careers</Link>
        <span>/</span>
        <span className="text-navy font-medium">New Job Posting</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Post a New Job</h1>
        <p className="text-sm text-muted mt-0.5">
          Fill in the details below. You can publish immediately or save as a draft.
        </p>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <JobForm />
      </div>
    </div>
  )
}
