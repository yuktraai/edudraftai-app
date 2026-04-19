/**
 * Phase 11B — Text chunking + OpenAI embedding
 *
 * chunkText   — splits raw text into ~500-word segments with 50-word overlap
 * embedText   — embeds a single query string (for generation-time retrieval)
 * embedChunks — batch-embeds chunk texts (for index-time upsert)
 */

import OpenAI from 'openai'
import { randomUUID } from 'crypto'

const EMBED_MODEL = 'text-embedding-3-small'
const BATCH_SIZE  = 100  // OpenAI accepts up to 2048 inputs but 100 is safe

let _openai = null
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}

/**
 * Split raw text into overlapping word-count chunks.
 *
 * @param {string} text
 * @param {number} maxWords   — target words per chunk (default 500 ≈ ~650 tokens)
 * @param {number} overlapWords — overlap between consecutive chunks (default 50)
 * @returns {string[]}
 */
export function chunkText(text, maxWords = 500, overlapWords = 50) {
  if (!text || text.trim().length === 0) return []

  const words = text.trim().split(/\s+/)
  const chunks = []
  let start = 0

  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length)
    chunks.push(words.slice(start, end).join(' '))
    if (end === words.length) break
    start = end - overlapWords  // back up by overlap to maintain continuity
  }

  return chunks
}

/**
 * Embed a single string — used at generation time to embed the query.
 *
 * @param {string} text
 * @returns {number[]} embedding vector (1536 dims for text-embedding-3-small)
 */
export async function embedText(text) {
  const openai = getOpenAI()
  const res = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: text.slice(0, 8000),  // hard cap; model supports ~8k tokens
  })
  return res.data[0].embedding
}

/**
 * Batch-embed an array of text chunks — used at index time.
 * Splits into batches of 100, exponential backoff on 429.
 *
 * @param {string[]} texts
 * @param {{ subjectId: string, docId: string, title: string }} meta
 * @returns {Array<{ id: string, embedding: number[], text: string, metadata: object }>}
 */
export async function embedChunks(texts, meta) {
  if (!texts || texts.length === 0) return []

  const openai  = getOpenAI()
  const results = []

  for (let b = 0; b < texts.length; b += BATCH_SIZE) {
    const batch = texts.slice(b, b + BATCH_SIZE)

    let attempt = 0
    let res
    while (attempt < 4) {
      try {
        res = await openai.embeddings.create({ model: EMBED_MODEL, input: batch })
        break
      } catch (err) {
        if (err?.status === 429 && attempt < 3) {
          await sleep(Math.pow(2, attempt) * 1000)   // 1s, 2s, 4s
          attempt++
        } else {
          throw err
        }
      }
    }

    for (let i = 0; i < batch.length; i++) {
      results.push({
        id:        randomUUID(),
        embedding: res.data[i].embedding,
        text:      batch[i],
        metadata:  {
          subject_id:  meta.subjectId,
          doc_id:      meta.docId,
          title:       meta.title,
          chunk_index: b + i,
        },
      })
    }
  }

  return results
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
