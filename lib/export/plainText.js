/**
 * toPlainText(rawOutput, { includeKey = true })
 * Strips markdown symbols for clean paste into Word/WhatsApp.
 */
export function toPlainText(rawOutput, { includeKey = true } = {}) {
  if (!rawOutput) return ''

  let text = rawOutput

  // Handle answer key
  const DELIM_START = '--- ANSWER KEY ---'
  const DELIM_END   = '--- END ANSWER KEY ---'
  const startIdx    = text.indexOf(DELIM_START)

  if (!includeKey && startIdx !== -1) {
    text = text.slice(0, startIdx).trimEnd()
  }
  // If includeKey=true, keep the full text including delimiters as-is

  // Strip markdown
  return text
    .replace(/^#{1,6}\s+/gm, '')           // headings: ## → plain
    .replace(/\*\*(.+?)\*\*/g, '$1')       // **bold** → plain
    .replace(/\*(.+?)\*/g, '$1')           // *italic* → plain
    .replace(/^[-*]\s+/gm, '• ')          // unordered bullets → •
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')// inline code
    .replace(/\n{3,}/g, '\n\n')            // collapse 3+ blank lines → 2
    .trim()
}
