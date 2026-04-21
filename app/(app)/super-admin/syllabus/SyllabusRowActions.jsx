'use client'

import Link from 'next/link'
import { ClearSyllabusButton } from './ClearSyllabusButton'

/**
 * Client-side action buttons for each subject row in the Syllabus Manager table.
 * Extracted so the parent page can remain a Server Component.
 */
export function SyllabusRowActions({ subjectId, subjectName, hasFile }) {
  return (
    <div className="flex items-center gap-2">
      <Link href={`/super-admin/syllabus/${subjectId}`}>
        <button className="text-teal text-xs font-medium hover:underline">View</button>
      </Link>
      <span className="text-border">|</span>
      <Link href={`/super-admin/syllabus/upload?subject_id=${subjectId}`}>
        <button className="text-teal text-xs font-medium hover:underline">Upload</button>
      </Link>
      {hasFile && (
        <>
          <span className="text-border">|</span>
          <ClearSyllabusButton subjectId={subjectId} subjectName={subjectName} size="sm" />
        </>
      )}
    </div>
  )
}
