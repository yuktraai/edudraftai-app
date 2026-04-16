'use client'

import { useState, useRef } from 'react'

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB

// Accepts either:
//   subjectIds={['id1', 'id2']}  — multi-department upload (recommended)
//   subjectId="id1"              — legacy single-subject upload
export function SyllabusUploader({ subjectIds, subjectId, onSuccess }) {
  // Normalise to array
  const ids = subjectIds ?? (subjectId ? [subjectId] : [])

  const fileInputRef = useRef(null)
  const [file, setFile]       = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult]   = useState(null) // { success, chunksCreated, error }

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.type !== 'application/pdf') {
      setResult({ success: false, error: 'Only PDF files are allowed.' })
      return
    }
    if (f.size > MAX_FILE_BYTES) {
      setResult({ success: false, error: 'File size must be 10 MB or less.' })
      return
    }
    setFile(f)
    setResult(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file || ids.length === 0) return

    setUploading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    // Send all subject IDs as JSON — parse-syllabus will fan out to each
    formData.append('subject_ids', JSON.stringify(ids))

    try {
      const res = await fetch('/api/parse-syllabus', {
        method: 'POST',
        body: formData,
      })
      // Read as text first — if the body is empty or non-JSON we get a useful message
      const text = await res.text()
      let json = {}
      try {
        json = text ? JSON.parse(text) : {}
      } catch {
        setResult({ success: false, error: `Server returned invalid response (status ${res.status}): ${text || 'empty body — check server terminal for the error'}` })
        return
      }
      if (!res.ok) {
        setResult({ success: false, error: json.error ?? `Server error ${res.status}` })
        return
      } else {
        setResult({
          success: true,
          chunksCreated: json.data?.chunks_created ?? 0,
          fileName:      json.data?.file_name,
          deptCount:     json.data?.dept_count ?? 1,
        })
        setFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        onSuccess?.()
      }
    } catch (err) {
      setResult({ success: false, error: `Network error: ${err?.message ?? 'Please try again.'}` })
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg px-6 py-8 text-center transition-colors ${
          file ? 'border-teal bg-teal-light' : 'border-border hover:border-teal'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="sr-only"
          id="syllabus-file-input"
          disabled={uploading}
        />
        <label htmlFor="syllabus-file-input" className="cursor-pointer">
          {file ? (
            <div>
              <svg className="w-8 h-8 text-teal mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-navy">{file.name}</p>
              <p className="text-xs text-muted mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
              <p className="text-xs text-teal mt-1 hover:underline">Click to change file</p>
            </div>
          ) : (
            <div>
              <svg className="w-8 h-8 text-muted mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm text-muted">Click to select a PDF file</p>
              <p className="text-xs text-muted mt-0.5">Max 10 MB</p>
            </div>
          )}
        </label>
      </div>

      {/* Result message */}
      {result && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          result.success
            ? 'bg-teal-light text-success border border-teal'
            : 'bg-red-50 text-error border border-red-200'
        }`}>
          {result.success ? (
            <div>
              <p className="font-semibold">Upload successful!</p>
              <p className="text-xs mt-0.5">
                {result.chunksCreated} topic chunk{result.chunksCreated !== 1 ? 's' : ''} extracted from{' '}
                <span className="font-mono">{result.fileName}</span>
                {result.deptCount > 1 && ` · applied to ${result.deptCount} departments`}
              </p>
            </div>
          ) : (
            <p>{result.error}</p>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!file || uploading || ids.length === 0}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal text-white text-sm font-semibold rounded-lg hover:bg-teal-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Uploading &amp; Parsing…
          </>
        ) : (
          <>
            Upload &amp; Parse PDF
            {ids.length > 1 && <span className="text-xs opacity-80">({ids.length} depts)</span>}
          </>
        )}
      </button>
    </form>
  )
}
