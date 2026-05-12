-- 0007_dm_tracking.sql
CREATE TABLE IF NOT EXISTS public.dm_tracking (
  id             uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     timestamptz  DEFAULT now() NOT NULL,
  prospect_name  text         NOT NULL,
  prospect_store text,
  reply_tone     text         CHECK (reply_tone IN ('positive', 'neutral', 'negative')),
  notes          text
);

ALTER TABLE public.dm_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service select" ON public.dm_tracking;
CREATE POLICY "service select"
  ON public.dm_tracking
  FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service insert" ON public.dm_tracking;
CREATE POLICY "service insert"
  ON public.dm_tracking
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
