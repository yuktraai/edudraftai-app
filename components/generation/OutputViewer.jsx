'use client'

import { useState, useMemo } from 'react'
import { FeedbackBar } from './FeedbackBar'
import { MathContent } from '@/components/ui/MathContent'
import { TestPlanRenderer } from './TestPlanRenderer'
import { ExamPaperRenderer } from './ExamPaperRenderer'
import { QuestionBankRenderer } from './QuestionBankRenderer'
import { splitAnswerKey } from '@/lib/export/parseAnswerKey'
import { CopyButton } from '@/components/ui/CopyButton'
import { toPlainText } from '@/lib/export/plainText'

export function OutputViewer({ content, isStreaming, generationId, contentType, isDemo = false, onRegenerate }) {
  const [showKey, setShowKey] = useState(true) // default: teacher view (with answers)
  const [regenOpen, setRegenOpen] = useState(false)
  const [regenInstruction, setRegenInstruction] = useState('')

  // Parse answer key once streaming is done
  const { content: questions, answerKey } = useMemo(
    () => (isStreaming ? { content, answerKey: null } : splitAnswerKey(content ?? '')),
    [content, isStreaming]
  )

  const hasAnswerKey = !!answerKey
  const displayContent = (isStreaming || showKey) ? content : questions

  if (!content && !isStreaming) return null

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-border bg-bg flex-wrap gap-2">
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

        {/* Toolbar buttons — 2-col grid on mobile to prevent overflow */}
        <div className="grid grid-cols-2 gap-1.5 md:flex md:items-center md:gap-2 md:flex-wrap w-full md:w-auto mt-2 md:mt-0">
          {/* Answer key toggle — only for MCQ/Question Bank after streaming */}
          {!isStreaming && hasAnswerKey && (
            <button
              onClick={() => setShowKey(p => !p)}
              className={`col-span-2 md:col-span-1 flex items-center justify-center gap-1.5 px-3 py-2.5 md:py-1.5 text-xs font-medium rounded-lg border transition-colors min-h-[44px] md:min-h-0 ${
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
              {/* Copy buttons — two variants for MCQ/QB, single for others */}
              {hasAnswerKey ? (
                <>
                  <CopyButton
                    content={toPlainText(content, { includeKey: true })}
                    label="Copy w/ Answers"
                    className="min-h-[44px] md:min-h-0"
                  />
                  <CopyButton
                    content={toPlainText(content, { includeKey: false })}
                    label="Copy w/o Answers"
                    className="min-h-[44px] md:min-h-0"
                  />
                </>
              ) : (
                <CopyButton
                  content={toPlainText(content, { includeKey: true })}
                  label="Copy"
                  className="min-h-[44px] md:min-h-0"
                />
              )}
              {generationId && (
                <a
                  href={`/drafts/${generationId}`}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 md:py-1.5 text-xs font-medium text-teal border border-teal rounded-lg hover:bg-teal hover:text-white transition-colors min-h-[44px] md:min-h-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                  View Draft
                </a>
              )}
              {!isStreaming && content && onRegenerate && (
                <button
                  onClick={() => setRegenOpen(r => !r)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 md:py-1.5 text-xs font-medium rounded-lg border transition-colors min-h-[44px] md:min-h-0 ${
                    regenOpen
                      ? 'bg-navy text-white border-navy'
                      : 'text-muted border-border hover:border-navy hover:text-navy'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Refine
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Refine panel */}
      {regenOpen && (
        <div className="px-4 md:px-5 py-4 border-b border-border bg-bg flex flex-col md:flex-row gap-3 items-stretch md:items-start">
          <textarea
            value={regenInstruction}
            onChange={e => setRegenInstruction(e.target.value)}
            placeholder='What should change? e.g. "Make questions harder" or "Add 2 more questions on subtopic X"'
            rows={3}
            className="flex-1 px-3 py-2 text-base md:text-sm rounded-lg border border-border bg-surface text-text placeholder-muted resize-none focus:ring-2 focus:ring-teal focus:outline-none"
          />
          <button
            onClick={() => {
              if (!regenInstruction.trim()) return
              onRegenerate(regenInstruction.trim())
              setRegenOpen(false)
              setRegenInstruction('')
            }}
            disabled={!regenInstruction.trim()}
            className="px-4 py-3 md:py-2 text-sm font-semibold bg-teal text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0 min-h-[44px]"
          >
            Apply (1 credit)
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="p-4 md:p-5 max-h-[60vh] overflow-y-auto overflow-x-hidden">
        {!isStreaming && isDemo && (
          <div className="mb-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-warning shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-warning">Demo Output</p>
              <p className="text-xs text-amber-700 mt-0.5">This was generated using one of your 3 free demo credits. Ask your college admin to allocate credits for full access.</p>
            </div>
          </div>
        )}

        {/* Content area with optional demo watermark */}
        <div className="relative">
          {!isStreaming && isDemo && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute', inset: 0, zIndex: 1,
                backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 60px, rgba(0,0,0,0.03) 60px, rgba(0,0,0,0.03) 120px)',
                pointerEvents: 'none',
                overflow: 'hidden',
              }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  top: `${i * 14}%`,
                  left: '-20%',
                  width: '140%',
                  textAlign: 'center',
                  transform: 'rotate(-30deg)',
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'rgba(0,0,0,0.04)',
                  letterSpacing: '0.1em',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}>
                  EduDraftAI Demo &nbsp;&nbsp;&nbsp; EduDraftAI Demo &nbsp;&nbsp;&nbsp; EduDraftAI Demo
                </div>
              ))}
            </div>
          )}
          <div style={{ position: 'relative', zIndex: 2 }}>
            {isStreaming ? (
              <pre className="whitespace-pre-wrap font-sans text-base md:text-sm text-text leading-relaxed">
                {content}
                <span className="inline-block w-0.5 h-4 bg-teal animate-pulse ml-0.5 align-middle" />
              </pre>
            ) : contentType === 'test_plan' ? (
              displayContent && <TestPlanRenderer content={displayContent} />
            ) : contentType === 'exam_paper' ? (
              displayContent && <ExamPaperRenderer content={displayContent} />
            ) : contentType === 'question_bank' ? (
              displayContent && <QuestionBankRenderer content={displayContent} />
            ) : (
              displayContent && <MathContent content={displayContent} />
            )}
          </div>
        </div>

        {!isStreaming && content && (
          <FeedbackBar generationId={generationId} />
        )}
      </div>
    </div>
  )
}
