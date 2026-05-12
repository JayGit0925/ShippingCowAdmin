-- 0006_quote_requests.sql
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id          uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz   DEFAULT now() NOT NULL,
  name        text          NOT NULL,
  company     text,
  email       text          NOT NULL,
  item_type   text,
  weight_lbs  integer,
  origin_zip  text
);

-- Only service role can read; anyone can insert (public form)
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public insert" ON public.quote_requests;
CREATE POLICY "public insert"
  ON public.quote_requests
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "service select" ON public.quote_requests;
CREATE POLICY "service select"
  ON public.quote_requests
  FOR SELECT
  USING (auth.role() = 'service_role');
