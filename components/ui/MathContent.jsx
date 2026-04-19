'use client'
import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

export function MathContent({ content, className = '', prose = true }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current || !content) return
    let html = content
    // Block math: \[ ... \]
    html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => {
      try {
        return '<div class="katex-block">' + katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false, output: 'html' }) + '</div>'
      } catch { return `<div class="math-error">\\[${formula}\\]</div>` }
    })
    // Inline math: \( ... \)
    html = html.replace(/\\\(([\s\S]*?)\\\)/g, (_, formula) => {
      try {
        return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false, output: 'html' })
      } catch { return `<span class="math-error">\\(${formula}\\)</span>` }
    })
    // Convert markdown-ish to HTML for non-math content
    html = html
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
      .replace(/\n\n+/g, '</p><p>')
      .replace(/^(?!<[hulo\/])(.+)$/gm, line => line.trim() ? `<p>${line}</p>` : '')
    ref.current.innerHTML = html
  }, [content])

  const proseClasses = prose
    ? 'prose prose-sm max-w-none prose-headings:text-navy prose-headings:font-heading prose-h2:text-lg prose-h3:text-base prose-p:text-text prose-li:text-text prose-strong:text-text'
    : ''

  return <div ref={ref} className={`math-content ${proseClasses} ${className}`} />
}
