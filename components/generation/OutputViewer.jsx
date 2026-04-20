'use client'

import { useState, useMemo } from 'react'
import { FeedbackBar } from './FeedbackBar'
import { MathContent } from '@/components/ui/MathContent'
import { splitAnswerKey } from '@/lib/export/parseAnswerKey'

export function OutputViewer({ content, isStreaming, generationId, contentType }) {
  const [copied,  setCopied]  = useState(false)
  const [showKey, setShowKey] = useState(true) // default: teacher view (with answers)

  // Parse answer key once streaming is done
  const { content: questions, answerKey } = useMemo(
    () => (isStreaming ? { content, answerKey: null } : splitAnswerKey(content ?? '')),
    [content, isStreaming]
  )

  const hasAnswerKey = !!answerKey
  const displayContent = (isStreaming || showKey) ? content : questions

  async function handleCopy() {
    // Copy only the questions part when answer key is hidden
    await navigator.clipboard.writeText(showKey ? content : questions)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!content && !isStreaming) return null

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-teal animate-pulse" />
              <span className="text-sm text-muted">Generating…</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-muted">Generation complete</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Answer key toggle — only for MCQ/Question Bank after streaming */}
          {!isStreaming && hasAnswerKey && (
            <button
              onClick={() => setShowKey(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                showKey
                  ? 'bg-teal text-white border-teal hover:bg-teal-2'
                  : 'text-muted border-border hover:border-teal hover:text-teal'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {showKey
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                }
              </svg>
              {showKey ? 'Answer Key: ON' : 'Answer Key: OFF'}
            </button>
          )}

          {!isStreaming && content && (
            <>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted border border-border rounded-lg hover:border-teal hover:text-teal transition-colors"
              >
                {copied ? (
                  <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>Copied!</>
                ) : (
                  <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>Copy</>
                )}
              </button>
              {generationId && (
                <a
                  href={`/drafts/${generationId}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal border border-teal rounded-lg hover:bg-teal hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                  View Draft
                </a>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="p-5 max-h-[60vh] overflow-y-auto">
        {isStreaming ? (
          <pre className="whitespace-pre-wrap font-sans text-sm text-text leading-relaxed">
            {content}
            <span className="inline-block w-0.5 h-4 bg-teal animate-pulse ml-0.5 align-middle" />
          </pre>
        ) : (
          displayContent && <MathContent content={displayContent} />
        )}

        {!isStreaming && content && (
          <FeedbackBar generationId={generationId} />
        )}
      </div>
    </div>
  )
}
