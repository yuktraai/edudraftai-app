'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export function SubjectTable({ subjects, onEdit, onDelete }) {
  if (!subjects || subjects.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <p className="text-muted text-sm">No subjects found.</p>
        <p className="text-muted text-xs mt-1">
          Adjust your filters or add a new subject.
        </p>
      </div>
    )
  }

  function handleDelete(subject) {
    if (!window.confirm(`Delete "${subject.name}"? This will soft-delete the subject and it will no longer appear for lecturers.`)) return
    onDelete(subject.id)
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-bg">
            <th className="text-left px-5 py-3 font-medium text-muted w-8">#</th>
            <th className="text-left px-5 py-3 font-medium text-muted">Name</th>
            <th className="text-left px-5 py-3 font-medium text-muted hidden md:table-cell">Code</th>
            <th className="text-left px-5 py-3 font-medium text-muted">Sem</th>
            <th className="text-left px-5 py-3 font-medium text-muted">Department</th>
            <th className="text-left px-5 py-3 font-medium text-muted hidden md:table-cell">College</th>
            <th className="text-left px-5 py-3 font-medium text-muted">Status</th>
            <th className="text-left px-5 py-3 font-medium text-muted">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {subjects.map((subject, idx) => (
            <tr key={subject.id} className="hover:bg-bg transition-colors">
              <td className="px-5 py-3 text-muted text-xs">{idx + 1}</td>
              <td className="px-5 py-3 font-medium text-text">{subject.name}</td>
              <td className="px-5 py-3 font-mono text-xs text-muted hidden md:table-cell">
                {subject.code || <span className="text-border">—</span>}
              </td>
              <td className="px-5 py-3 text-muted">{subject.semester}</td>
              <td className="px-5 py-3 text-muted text-xs">
                {subject.departments?.name ?? '—'}
              </td>
              <td className="px-5 py-3 text-muted text-xs hidden md:table-cell">
                {subject.colleges?.name ?? '—'}
              </td>
              <td className="px-5 py-3">
                {subject.is_active
                  ? <Badge variant="success">Active</Badge>
                  : <Badge variant="muted">Inactive</Badge>
                }
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEdit(subject)}
                  >
                    Edit
                  </Button>
                  <Link
                    href={`/super-admin/subjects/${subject.id}/reference-books`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-muted hover:border-teal hover:text-teal transition-colors"
                  >
                    Books
                  </Link>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(subject)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
