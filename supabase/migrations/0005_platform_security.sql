-- 0005_platform_security.sql
-- Phase E — feature flags, model pins, news_items approval workflow.
-- Apply via Supabase Dashboard SQL editor.

------------------------------------------------------------------------------
-- feature_flags
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feature_flags (
  flag_key        text PRIMARY KEY,
  description     text,
  default_enabled boolean NOT NULL DEFAULT false,
  enabled_tiers   text[] NOT NULL DEFAULT '{}',
  org_overrides   jsonb NOT NULL DEFAULT '{}'::jsonb,
  rollout_pct     integer NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
  updated_by      uuid REFERENCES auth.users(id),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS feature_flags_no_client ON public.feature_flags;
CREATE POLICY feature_flags_no_client ON public.feature_flags
  FOR ALL USING (false) WITH CHECK (false);

------------------------------------------------------------------------------
-- model_pins
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.model_pins (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid,                 -- null = global pin
  role         text NOT NULL CHECK (role IN ('parser', 'insight', 'chat')),
  model_string text NOT NULL,
  pinned_by    uuid REFERENCES auth.users(id),
  pinned_at    timestamptz NOT NULL DEFAULT now(),
  expiry       timestamptz,
  UNIQUE (org_id, role)
);
CREATE INDEX IF NOT EXISTS model_pins_role_idx ON public.model_pins (role);
ALTER TABLE public.model_pins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS model_pins_no_client ON public.model_pins;
CREATE POLICY model_pins_no_client ON public.model_pins
  FOR ALL USING (false) WITH CHECK (false);

------------------------------------------------------------------------------
-- news_items conditional ALTER (user-portal-owned)
------------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.news_items') IS NOT NULL THEN
    BEGIN
      ALTER TABLE public.news_items ADD COLUMN IF NOT EXISTS approval_state text
        DEFAULT 'pending'
        CHECK (approval_state IN ('pending','approved','rejected'));
      ALTER TABLE public.news_items ADD COLUMN IF NOT EXISTS approved_by uuid;
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'news_items: insufficient privilege to alter, skipping';
    END;
  ELSE
    RAISE NOTICE 'news_items table not present, skipping ALTER';
  END IF;
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------------------------
-- AI kill switch convenience: seed `mooovy_enabled` flag (idempotent)
------------------------------------------------------------------------------
INSERT INTO public.feature_flags (flag_key, description, default_enabled)
VALUES (
  'mooovy_enabled',
  'Master AI kill switch. When false, all Mooovy endpoints in apps/web return a static maintenance message and skip Anthropic calls.',
  true
)
ON CONFLICT (flag_key) DO NOTHING;
