'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { FavoriteButton } from '@/components/ui/FavoriteButton'

export function SyllabusClient({ deptList, hasFavorites }) {
  const [showAll, setShowAll] = useState(!hasFavorites)

  const visibleDepts = showAll
    ? deptList
    : deptList.map((dept) => ({
        ...dept,
        semesters: Object.fromEntries(
          Object.entries(dept.semesters).map(([sem, subjects]) => [
            sem,
            subjects.filter((s) => s.favorited),
          ]).filter(([, subjects]) => subjects.length > 0)
        ),
      })).filter((dept) =>
        Object.values(dept.semesters).some((subs) => subs.length > 0) || dept.favorited
      )

  if (deptList.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <p className="text-muted text-sm">No subjects found for your college.</p>
        <p className="text-muted text-xs mt-1">Contact your college admin or Yuktra AI team.</p>
      </div>
    )
  }

  return (
    <>
      {/* Toggle bar */}
      {hasFavorites && (
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={() => setShowAll(false)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !showAll ? 'bg-teal text-white' : 'bg-bg text-muted hover:text-text border border-border'
            }`}
          >
            ★ My Subjects
          </button>
          <button
            onClick={() => setShowAll(true)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              showAll ? 'bg-teal text-white' : 'bg-bg text-muted hover:text-text border border-border'
            }`}
          >
            All Subjects
          </button>
        </div>
      )}

      <div className="space-y-8">
        {visibleDepts.map((dept) => (
          <div key={dept.id}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-heading text-base font-bold text-navy">
                {dept.favorited && <span className="text-teal mr-1">★</span>}
                {dept.name}
              </h2>
              <FavoriteButton
                itemType="department"
                itemId={dept.id}
                initialState={dept.favorited}
              />
            </div>

            {Object.keys(dept.semesters).length === 0 && !showAll && (
              <p className="text-xs text-muted px-1">No starred subjects in this department.</p>
            )}

            {Object.entries(dept.semesters)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([sem, semSubjects]) => (
                <div key={sem} className="mb-4">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">
                    Semester {sem}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {semSubjects.map((s) => (
                      <div key={s.id} className="relative group">
                        <Link
                          href={`/syllabus/${s.id}`}
                          className="block bg-surface border border-border rounded-xl p-4 hover:border-teal hover:shadow-sm transition-all pr-10"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-text text-sm truncate">
                                {s.favorited && <span className="text-teal mr-1">★</span>}
                                {s.name}
                              </p>
                              <p className="text-xs font-mono text-muted mt-0.5">{s.code}</p>
                            </div>
                            <Badge variant={s.chunk_count > 0 ? 'success' : 'muted'}>
                              {s.chunk_count} topic{s.chunk_count !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          {s.chunk_count === 0 && (
                            <p className="text-xs text-muted mt-2">Syllabus not yet uploaded</p>
                          )}
                        </Link>
                        {/* Star button overlaid top-right */}
                        <div className="absolute top-3 right-3">
                          <FavoriteButton
                            itemType="subject"
                            itemId={s.id}
                            initialState={s.favorited}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  )
}
