-- Phase A foundation: platform_admins + audit_log
-- Run via Supabase Dashboard → SQL editor.

-- ============================================================
-- platform_admins
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('super-admin','support-admin','billing-admin')),
  is_active  boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS by default; deny all to anon/authenticated.
DROP POLICY IF EXISTS "platform_admins_self_read" ON public.platform_admins;
CREATE POLICY "platform_admins_self_read"
  ON public.platform_admins
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- audit_log (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid NOT NULL REFERENCES auth.users(id),
  actor_role    text NOT NULL CHECK (actor_role IN ('super-admin','support-admin','billing-admin','system')),
  org_id        uuid,
  action        text NOT NULL,
  resource_type text NOT NULL,
  resource_id   text NOT NULL,
  before_value  jsonb,
  after_value   jsonb,
  reason        text,
  ticket_id     uuid,
  ip_address    inet
);

CREATE INDEX IF NOT EXISTS audit_log_occurred_at_idx ON public.audit_log (occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_org_id_idx       ON public.audit_log (org_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx        ON public.audit_log (actor_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_action_idx       ON public.audit_log (action, occurred_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT for anon or authenticated. Service role bypasses.
-- Append-only: block UPDATE/DELETE for ALL roles, including service role.
DROP POLICY IF EXISTS "audit_log_no_update" ON public.audit_log;
CREATE POLICY "audit_log_no_update"
  ON public.audit_log
  FOR UPDATE
  TO public
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "audit_log_no_delete" ON public.audit_log;
CREATE POLICY "audit_log_no_delete"
  ON public.audit_log
  FOR DELETE
  TO public
  USING (false);

-- Belt-and-suspenders trigger: even if RLS is bypassed, raise on UPDATE/DELETE.
CREATE OR REPLACE FUNCTION public.audit_log_block_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$;

DROP TRIGGER IF EXISTS audit_log_block_update ON public.audit_log;
CREATE TRIGGER audit_log_block_update
  BEFORE UPDATE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_block_mutation();

DROP TRIGGER IF EXISTS audit_log_block_delete ON public.audit_log;
CREATE TRIGGER audit_log_block_delete
  BEFORE DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_block_mutation();

-- ============================================================
-- Founder seed (manual step)
-- ============================================================
-- After creating the founder auth user via Supabase Dashboard → Authentication → Users,
-- run this with the real UUID substituted:
--
--   INSERT INTO public.platform_admins (user_id, role, is_active)
--   VALUES ('<founder-auth-uuid>', 'super-admin', true);
