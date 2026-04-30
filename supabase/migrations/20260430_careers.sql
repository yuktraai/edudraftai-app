-- ============================================================
-- EduDraftAI — Careers Feature Migration
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Created: 2026-04-30
-- ============================================================

-- ─────────────────────────────────────────
-- 1. JOB POSTINGS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_postings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  department       TEXT NOT NULL,
  location         TEXT NOT NULL,          -- e.g. 'Remote', 'Bhubaneswar'
  type             TEXT NOT NULL,          -- e.g. 'Full-time', 'Part-time', 'Internship'
  experience       TEXT NOT NULL,          -- e.g. '0-1 years', '1-3 years'
  description      TEXT NOT NULL,          -- markdown supported
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  requirements     TEXT[] NOT NULL DEFAULT '{}',
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.job_postings IS 'Active job openings at Yuktra AI / EduDraftAI — managed by super_admin';

CREATE INDEX idx_job_postings_active ON public.job_postings (is_active, created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER trg_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─────────────────────────────────────────
-- 2. JOB APPLICATIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT NOT NULL,
  current_role  TEXT,                      -- optional: current job title or year of study
  resume_path   TEXT NOT NULL,             -- Supabase Storage path: applications/{job_id}/{ts}_{filename}
  resume_url    TEXT NOT NULL,             -- public or signed URL stored at insert time
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'in_progress', 'selected', 'rejected')),
  applied_at    TIMESTAMPTZ DEFAULT NOW(),
  notes         TEXT                       -- internal notes by super_admin
);

COMMENT ON TABLE public.job_applications IS 'Applications submitted via /careers — private, super_admin only';

CREATE INDEX idx_job_applications_job    ON public.job_applications (job_id, applied_at DESC);
CREATE INDEX idx_job_applications_status ON public.job_applications (status);
CREATE INDEX idx_job_applications_email  ON public.job_applications (email);


-- ─────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE public.job_postings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- job_postings: public can read active postings (anon + authenticated)
CREATE POLICY "public can read active job postings"
  ON public.job_postings FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- job_postings: super_admin has full access
CREATE POLICY "super_admin manages job postings"
  ON public.job_postings FOR ALL
  TO authenticated
  USING (public.my_role() = 'super_admin')
  WITH CHECK (public.my_role() = 'super_admin');

-- job_applications: no public SELECT — super_admin only via service role
-- (API routes use adminSupabase / service role, bypasses RLS)
-- We still define a super_admin policy for direct dashboard queries:
CREATE POLICY "super_admin manages job applications"
  ON public.job_applications FOR ALL
  TO authenticated
  USING (public.my_role() = 'super_admin')
  WITH CHECK (public.my_role() = 'super_admin');


-- ─────────────────────────────────────────
-- 4. STORAGE BUCKET — resumes (private)
-- Create via Supabase Dashboard: Storage > New Bucket
-- Name: 'resumes'
-- Public: false (private)
-- File size limit: 5MB
-- Allowed MIME types: application/pdf, application/msword,
--   application/vnd.openxmlformats-officedocument.wordprocessingml.document
--
-- Storage access: service role only (via adminSupabase in API routes)
-- No public storage policies needed — signed URLs generated on demand
-- ─────────────────────────────────────────
