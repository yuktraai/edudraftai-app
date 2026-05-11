-- Phase 54: Add 'exam_paper' and 'diagram' to content_type CHECK constraint
-- The original constraint only had: lesson_notes, mcq_bank, question_bank, test_plan
-- exam_paper was added in a previous phase but the constraint was never updated.
-- This migration widens the constraint to include all current content types.

-- Step 1: Drop the existing (auto-named) CHECK constraint on content_type
ALTER TABLE public.content_generations
  DROP CONSTRAINT IF EXISTS content_generations_content_type_check;

-- Step 2: Add the updated constraint with all valid content types
ALTER TABLE public.content_generations
  ADD CONSTRAINT content_generations_content_type_check
  CHECK (content_type IN (
    'lesson_notes',
    'mcq_bank',
    'question_bank',
    'test_plan',
    'exam_paper',
    'diagram'
  ));
