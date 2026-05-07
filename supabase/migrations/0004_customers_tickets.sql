-- 0004_customers_tickets.sql
-- Phase C — admin-owned tables for customer ops + support tickets.
-- Idempotent. Apply via Supabase Dashboard SQL editor.

------------------------------------------------------------------------------
-- admin_notes — internal per-org notes (admin-only)
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL,
  note       text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_notes_org_idx
  ON public.admin_notes (org_id, created_at DESC);

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_notes_no_client ON public.admin_notes;
CREATE POLICY admin_notes_no_client ON public.admin_notes
  FOR ALL USING (false) WITH CHECK (false);

------------------------------------------------------------------------------
-- impersonation_sessions
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.impersonation_sessions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id         uuid NOT NULL REFERENCES auth.users(id),
  target_user_id        uuid NOT NULL REFERENCES auth.users(id),
  org_id                uuid,
  reason                text NOT NULL,
  ticket_id             text,
  token_hash            text NOT NULL,
  started_at            timestamptz NOT NULL DEFAULT now(),
  expires_at            timestamptz NOT NULL,
  ended_at              timestamptz,
  suppress_notification boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS impersonation_sessions_admin_idx
  ON public.impersonation_sessions (admin_user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS impersonation_sessions_target_idx
  ON public.impersonation_sessions (target_user_id, started_at DESC);

ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS impersonation_sessions_no_client ON public.impersonation_sessions;
CREATE POLICY impersonation_sessions_no_client ON public.impersonation_sessions
  FOR ALL USING (false) WITH CHECK (false);

------------------------------------------------------------------------------
-- support_tickets
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL,
  user_id     uuid REFERENCES auth.users(id),
  subject     text NOT NULL,
  status      text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','resolved')),
  priority    text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('urgent','high','normal','low')),
  assignee_user_id uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_tickets_org_idx
  ON public.support_tickets (org_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx
  ON public.support_tickets (status, priority, updated_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_assignee_idx
  ON public.support_tickets (assignee_user_id, updated_at DESC)
  WHERE assignee_user_id IS NOT NULL;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS support_tickets_no_client ON public.support_tickets;
CREATE POLICY support_tickets_no_client ON public.support_tickets
  FOR ALL USING (false) WITH CHECK (false);

------------------------------------------------------------------------------
-- ticket_messages
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  from_type  text NOT NULL CHECK (from_type IN ('user','admin','note')),
  author_id  uuid REFERENCES auth.users(id),
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ticket_messages_ticket_idx
  ON public.ticket_messages (ticket_id, created_at);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ticket_messages_no_client ON public.ticket_messages;
CREATE POLICY ticket_messages_no_client ON public.ticket_messages
  FOR ALL USING (false) WITH CHECK (false);

------------------------------------------------------------------------------
-- Conditional ALTERs on user-portal-owned tables.
-- Skip silently if the target table does not yet exist in this Supabase
-- project (user-portal repo not yet migrated).
------------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.subscriptions') IS NOT NULL THEN
    BEGIN
      ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS quota_override jsonb;
      ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS ai_suspended boolean DEFAULT false;
      ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS tier_override jsonb;
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'subscriptions: insufficient privilege to alter, skipping';
    END;
  ELSE
    RAISE NOTICE 'subscriptions table not present, skipping ALTER';
  END IF;

  IF to_regclass('public.orgs') IS NOT NULL THEN
    BEGIN
      ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS assigned_am_user_id uuid;
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'orgs: insufficient privilege to alter, skipping';
    END;
  ELSE
    RAISE NOTICE 'orgs table not present, skipping ALTER';
  END IF;
END;
$$ LANGUAGE plpgsql;
