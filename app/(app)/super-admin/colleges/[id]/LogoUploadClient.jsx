'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CollegeLogo } from '@/components/ui/CollegeLogo'

export function LogoUploadClient({ collegeId, currentLogoUrl, collegeName }) {
  const [preview,   setPreview]   = useState(currentLogoUrl)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState(null)
  const [success,   setSuccess]   = useState(false)
  const [file,      setFile]      = useState(null)
  const inputRef = useRef(null)
  const router   = useRouter()

  function handleFileSelect(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setError(null)
    setSuccess(false)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError(null)

    const form = new FormData()
    form.append('file', file)

    try {
      const res  = await fetch(`/api/colleges/${collegeId}/logo`, { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Upload failed'); return }
      // Update preview to the real Supabase public URL returned by the API
      if (json.data?.logo_url) setPreview(json.data.logo_url)
      setSuccess(true)
      setFile(null)
      router.refresh()
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-start gap-6">
      <CollegeLogo logoUrl={preview} collegeName={collegeName} size="lg" />

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:border-teal hover:text-teal transition-colors disabled:opacity-50"
          >
            {file ? 'Change file' : 'Choose file'}
          </button>
          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-2 text-sm font-semibold bg-teal text-white rounded-lg hover:bg-teal-2 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload logo'}
            </button>
          )}
        </div>

        {file && !uploading && (
          <p className="text-xs text-muted">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
        )}
        {error   && <p className="text-xs text-error">{error}</p>}
        {success && <p className="text-xs text-success">Logo updated successfully.</p>}

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  )
}
