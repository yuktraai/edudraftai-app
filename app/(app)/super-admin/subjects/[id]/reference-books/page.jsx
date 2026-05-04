/**
 * Phase 52.4 — Reference books are now managed at the subject-code level.
 * This page redirects to the canonical docs section.
 */

import { redirect } from 'next/navigation'

export default function OldReferenceBooksPage() {
  redirect('/super-admin/canonical-docs')
}
