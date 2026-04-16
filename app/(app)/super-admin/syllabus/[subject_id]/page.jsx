import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/Badge'
import { ChunksEditor } from './ChunksEditor'

export const metadata = { title: 'Subject Syllabus — EduDraftAI' }

function ParseStatusBadge({ status }) {
  const map = {
    completed:  { variant: 'success', label: 'Parsed' },
    processing: { variant: 'info',    label: 'Processing' },
    pending:    { variant: 'muted',   label: 'Pending' },
    failed:     { variant: 'error',   label: 'Failed' },
  }
  const { variant, label } = map[status] ?? { variant: 'muted', label: 'Unknown' }
  return <Badge variant={variant}>{label}</Badge>
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function SuperAdminSubjectSyllabusPage({ params }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const { subject_id } = params

  // Fetch subject (no college_id restriction for super_admin)
  const { data: subject } = await adminSupabase
    .from('subjects')
    .select('id, name, code, semester, college_id, colleges ( name ), departments ( name )')
    .eq('id', subject_id)
    .single()

  if (!subject) notFound()

  // Fetch syllabus files
  const { data: syllabusFiles } = await adminSupabase
    .from('syllabus_files')
    .select('id, file_name, parse_status, uploaded_by, created_at, updated_at')
    .eq('subject_id', subject_id)
    .order('updated_at', { ascending: false })

  // Fetch chunks
  const { data: chunks } = await adminSupabase
    .from('syllabus_chunks')
    .select('id, unit_number, topic, subtopics, raw_text')
    .eq('subject_id', subject_id)
    .order('unit_number')

  // Group chunks by unit_number
  const groupedChunks = {}
  for (const chunk of chunks ?? []) {
    const unit = chunk.unit_number ?? 0
    if (!groupedChunks[unit]) groupedChunks[unit] = []
    groupedChunks[unit].push(chunk)
  }

  const latestFile = syllabusFiles?.[0] ?? null

  return (
    <div className="p-8 max-w-4xl">
      {/* Back + Header */}
      <div className="mb-6">
        <Link href="/super-admin/syllabus" className="text-sm text-muted hover:text-text transition-colors mb-4 flex items-center gap-1 w-fit">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Syllabus Manager
        </Link>

        <div className="flex items-start justify-between mt-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-navy">{subject.name}</h1>
            <p className="text-muted text-sm mt-1">
              {subject.colleges?.name} &middot; {subject.departments?.name} &middot; Semester {subject.semester} &middot;
              <span className="font-mono ml-1">{subject.code}</span>
            </p>
          </div>
          <Link href={`/super-admin/syllabus/upload?subject_id=${subject_id}`}>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white text-sm font-semibold rounded-lg hover:bg-teal-2 transition-colors">
              Re-upload PDF
            </button>
          </Link>
        </div>
      </div>

      {/* File Info */}
      {syllabusFiles && syllabusFiles.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-5 mb-6">
          <h2 className="font-heading text-sm font-bold text-navy mb-3">Uploaded Files</h2>
          <div className="space-y-2">
            {syllabusFiles.map((f) => (
              <div key={f.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-error" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-mono text-xs text-text">{f.file_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <ParseStatusBadge status={f.parse_status} />
                  <span className="text-xs text-muted">{formatDate(f.updated_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chunks */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-base font-bold text-navy">
          Syllabus Chunks
          <span className="ml-2 text-sm font-normal text-muted">({chunks?.length ?? 0} total)</span>
        </h2>
      </div>

      {chunks && chunks.length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groupedChunks)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([unit, unitChunks]) => (
              <div key={unit}>
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                  Unit {unit === '0' ? '—' : unit}
                </p>
                <div className="space-y-3">
                  {unitChunks.map((chunk) => (
                    <ChunksEditor key={chunk.id} chunk={chunk} subjectId={subject_id} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">No syllabus chunks found.</p>
          <p className="text-muted text-xs mt-1">Upload a PDF to parse and extract syllabus content.</p>
          <div className="mt-4">
            <Link href={`/super-admin/syllabus/upload?subject_id=${subject_id}`}>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white text-sm font-semibold rounded-lg hover:bg-teal-2 transition-colors">
                Upload PDF
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
