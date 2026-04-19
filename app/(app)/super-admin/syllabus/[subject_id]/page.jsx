import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/Badge'
import { ChunksEditor } from './ChunksEditor'
import { ParseQualityTab } from './ParseQualityTab'
import { RagDocsTab } from './RagDocsTab'
import { ClearSyllabusButton } from '../ClearSyllabusButton'

export const metadata = { title: 'Subject Syllabus — EduDraftAI' }

function ParseStatusBadge({ status }) {
  const map = {
    completed:       { variant: 'success', label: 'Parsed' },
    low_confidence:  { variant: 'warning', label: 'Low Confidence' },
    processing:      { variant: 'info',    label: 'Processing' },
    pending:         { variant: 'muted',   label: 'Pending' },
    failed:          { variant: 'error',   label: 'Failed' },
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

export default async function SuperAdminSubjectSyllabusPage({ params, searchParams }) {
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
  const activeTab = searchParams?.tab ?? 'chunks'

  // Fetch subject (no college_id restriction for super_admin)
  const { data: subject } = await adminSupabase
    .from('subjects')
    .select('id, name, code, semester, college_id, colleges(name), departments(name)')
    .eq('id', subject_id)
    .single()

  if (!subject) notFound()

  // Fetch syllabus files
  const { data: syllabusFiles } = await adminSupabase
    .from('syllabus_files')
    .select('id, file_name, parse_status, uploaded_by, created_at, updated_at')
    .eq('subject_id', subject_id)
    .order('created_at', { ascending: false })

  // Fetch chunks (include parse_confidence if column exists)
  const { data: rawChunks } = await adminSupabase
    .from('syllabus_chunks')
    .select('id, unit_number, topic, subtopics, raw_text, parse_confidence')
    .eq('subject_id', subject_id)
    .order('unit_number')

  const chunks = rawChunks ?? []

  // Fetch RAG documents for this subject
  const { data: ragDocs } = await adminSupabase
    .from('rag_documents')
    .select('id, title, doc_type, chunk_count, index_status, indexed_at, created_at')
    .eq('subject_id', subject_id)
    .order('created_at', { ascending: false })

  // Group chunks by unit_number
  const groupedChunks = {}
  for (const chunk of chunks) {
    const unit = chunk.unit_number ?? 0
    if (!groupedChunks[unit]) groupedChunks[unit] = []
    groupedChunks[unit].push(chunk)
  }

  const latestFile = syllabusFiles?.[0] ?? null
  const hasLowConfidence = syllabusFiles?.some(f => f.parse_status === 'low_confidence')

  // Compute overall parse confidence from chunks
  const avgConfidence = chunks.length > 0 && chunks.some(c => c.parse_confidence != null)
    ? chunks.reduce((s, c) => s + (c.parse_confidence ?? 0), 0) / chunks.length
    : null

  const ragEnabled    = subject.rag_enabled ?? false
  const ragDocCount   = (ragDocs ?? []).filter(d => d.index_status === 'indexed').length

  const TABS = [
    { id: 'chunks',  label: 'Chunks' },
    { id: 'quality', label: 'Parse Quality' },
    { id: 'rag',     label: 'Reference Docs', badge: ragDocCount > 0 ? ragDocCount : null },
  ]

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

        <div className="flex items-start justify-between mt-4 gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-2xl font-bold text-navy">{subject.name}</h1>
            <p className="text-muted text-sm mt-1">
              {subject.colleges?.name} &middot; {subject.departments?.name} &middot; Semester {subject.semester} &middot;
              <span className="font-mono ml-1">{subject.code}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ClearSyllabusButton
              subjectId={subject_id}
              subjectName={subject.name}
              redirectTo="/super-admin/syllabus"
            />
            <Link href={`/super-admin/syllabus/upload?subject_id=${subject_id}`}>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white text-sm font-semibold rounded-lg hover:bg-teal-2 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Re-upload PDF
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Low confidence warning banner */}
      {hasLowConfidence && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
          <svg className="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-warning">Low parse confidence detected</p>
            <p className="text-xs text-warning/80 mt-0.5">
              The AI extraction found issues with this PDF. Review subtopics in the Parse Quality tab and edit manually if needed, or re-upload a cleaner version.
            </p>
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      {syllabusFiles && syllabusFiles.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-5 mb-6">
          <h2 className="font-heading text-sm font-bold text-navy mb-3">Uploaded Files</h2>
          <div className="space-y-2">
            {syllabusFiles.map(f => (
              <div key={f.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-error" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-mono text-xs text-text">{f.file_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <ParseStatusBadge status={f.parse_status} />
                  <span className="text-xs text-muted">{formatDate(f.updated_at ?? f.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border mb-6">
        {TABS.map(t => (
          <Link
            key={t.id}
            href={`/super-admin/syllabus/${subject_id}?tab=${t.id}`}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.id
                ? 'border-teal text-teal'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            {t.label}
            {t.id === 'quality' && avgConfidence != null && (
              <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                avgConfidence >= 0.8 ? 'bg-teal-light text-teal' :
                avgConfidence >= 0.5 ? 'bg-amber-50 text-warning' :
                'bg-red-50 text-error'
              }`}>
                {Math.round(avgConfidence * 100)}%
              </span>
            )}
            {t.id === 'rag' && t.badge != null && (
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-light text-teal">
                {t.badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Chunks tab */}
      {activeTab === 'chunks' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base font-bold text-navy">
              Syllabus Chunks
              <span className="ml-2 text-sm font-normal text-muted">({chunks.length} total)</span>
            </h2>
          </div>

          {chunks.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(groupedChunks)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([unit, unitChunks]) => (
                  <div key={unit}>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                      Unit {unit === '0' ? '—' : unit}
                    </p>
                    <div className="space-y-3">
                      {unitChunks.map(chunk => (
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
        </>
      )}

      {/* Parse Quality tab (Phase 10D) */}
      {activeTab === 'quality' && (
        <ParseQualityTab
          chunks={chunks}
          subjectId={subject_id}
          latestFileId={latestFile?.id ?? null}
        />
      )}

      {/* Reference Docs tab (Phase 11E) */}
      {activeTab === 'rag' && (
        <RagDocsTab
          docs={ragDocs ?? []}
          subjectId={subject_id}
          ragEnabled={ragEnabled}
        />
      )}
    </div>
  )
}
