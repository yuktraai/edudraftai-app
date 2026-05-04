/**
 * Phase 11A / Phase 51 — Pinecone client
 *
 * One index (edudraftai-rag), canonical namespace per SCTEVT subject code.
 * Namespace format: "code:TH2" — shared across all colleges teaching that code.
 *
 * Env vars required:
 *   PINECONE_API_KEY
 *   PINECONE_INDEX_NAME   (e.g. "edudraftai-rag")
 */

import { Pinecone } from '@pinecone-database/pinecone'

/**
 * 51.1 — Returns the canonical Pinecone namespace for an SCTEVT subject code.
 * This is the only namespace format used in EduDraftAI — shared across all colleges.
 *
 * @param {string} code  e.g. 'TH2' or 'th2'
 * @returns {string}     e.g. 'code:TH2'
 */
export function canonicalNamespace(code) {
  return `code:${code.trim().toUpperCase()}`
}

let _client = null
function getClient() {
  if (!_client) _client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
  return _client
}

function getIndex() {
  return getClient().index(process.env.PINECONE_INDEX_NAME ?? 'edudraftai-rag')
}

/**
 * Upsert embedding vectors for a subject namespace.
 *
 * @param {string} subjectId  — used as Pinecone namespace
 * @param {Array<{ id: string, embedding: number[], text: string, metadata: object }>} chunks
 */
export async function upsertChunks(subjectId, chunks) {
  if (!chunks || chunks.length === 0) return

  const ns = getIndex().namespace(subjectId)

  // Pinecone SDK v7: upsert({ records: [...] }) — NOT a bare array
  const BATCH = 100
  for (let i = 0; i < chunks.length; i += BATCH) {
    const records = chunks.slice(i, i + BATCH).map(c => ({
      id:       c.id,
      values:   c.embedding,
      metadata: { ...c.metadata, text: c.text },  // store text in metadata for retrieval
    }))
    await ns.upsert({ records })
  }
}

/**
 * Query the Pinecone namespace for the most relevant chunks.
 *
 * @param {string} subjectId   — namespace
 * @param {number[]} queryEmbedding — pre-computed embedding vector
 * @param {number} topK        — number of results (default 5)
 * @returns {Array<{ text: string, score: number, metadata: object }>}
 */
export async function queryContext(subjectId, queryEmbedding, topK = 5) {
  const ns = getIndex().namespace(subjectId)

  const result = await ns.query({
    vector:          queryEmbedding,
    topK,
    includeMetadata: true,
  })

  return (result.matches ?? []).map(m => ({
    text:     m.metadata?.text ?? '',
    score:    m.score ?? 0,
    metadata: m.metadata ?? {},
  }))
}

/**
 * Delete all vectors for a specific document from a subject namespace.
 * Uses metadata filter: doc_id = docId.
 *
 * Note: Pinecone free tier supports deleteMany by IDs only (not metadata filter).
 * We store vector IDs in DB (rag_documents.vector_ids) to support exact deletion.
 *
 * @param {string} subjectId
 * @param {string[]} vectorIds  — array of vector IDs to delete
 */
export async function deleteDocumentVectors(subjectId, vectorIds) {
  if (!vectorIds || vectorIds.length === 0) return
  const ns = getIndex().namespace(subjectId)
  await ns.deleteMany(vectorIds)
}

/**
 * Delete ALL vectors in a subject namespace (full namespace wipe).
 * Used when a subject's entire RAG index is reset.
 *
 * @param {string} subjectId
 */
export async function deleteNamespace(subjectId) {
  const ns = getIndex().namespace(subjectId)
  await ns.deleteAll()
}
