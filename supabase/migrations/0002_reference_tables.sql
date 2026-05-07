-- Phase B.1 — 6 reference tables + rate_card_drafts + scheduled_publishes
-- Apply by pasting into Supabase Dashboard → SQL Editor → New query → Run.
-- Phase A's 0001_phase_a.sql must already be applied (creates platform_admins + audit_log).

------------------------------------------------------------------------------
-- 1. Zone matrix (~42k rows expected after seed)
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.zone_matrix (
  id                 bigserial PRIMARY KEY,
  origin_zip_prefix  text NOT NULL,
  dest_zip_prefix    text NOT NULL,
  zone               smallint NOT NULL CHECK (zone BETWEEN 1 AND 9),
  effective_from     date NOT NULL,
  effective_to       date,
  UNIQUE (origin_zip_prefix, dest_zip_prefix, effective_from)
);
CREATE INDEX IF NOT EXISTS zone_matrix_lookup_idx
  ON public.zone_matrix (origin_zip_prefix, dest_zip_prefix);

------------------------------------------------------------------------------
-- 2. Our negotiated carrier rates
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.our_carrier_rates (
  id              bigserial PRIMARY KEY,
  carrier         text NOT NULL,
  service         text NOT NULL,
  zone            smallint NOT NULL CHECK (zone BETWEEN 1 AND 9),
  weight_lb_min   numeric(10,2) NOT NULL,
  weight_lb_max   numeric(10,2) NOT NULL,
  rate_usd        numeric(10,4) NOT NULL,
  effective_from  date NOT NULL,
  effective_to    date,
  UNIQUE (carrier, service, zone, weight_lb_min, effective_from)
);
CREATE INDEX IF NOT EXISTS our_carrier_rates_lookup_idx
  ON public.our_carrier_rates (carrier, service, zone, weight_lb_min);

------------------------------------------------------------------------------
-- 3. Public retail rates (benchmark)
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carrier_retail_rates (
  id              bigserial PRIMARY KEY,
  carrier         text NOT NULL,
  service         text NOT NULL,
  zone            smallint NOT NULL CHECK (zone BETWEEN 1 AND 9),
  weight_lb_min   numeric(10,2) NOT NULL,
  weight_lb_max   numeric(10,2) NOT NULL,
  rate_usd        numeric(10,4) NOT NULL,
  effective_from  date NOT NULL,
  effective_to    date,
  UNIQUE (carrier, service, zone, weight_lb_min, effective_from)
);

------------------------------------------------------------------------------
-- 4. Warehousing fees (receiving, putaway, storage)
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.our_warehousing_fees (
  id              bigserial PRIMARY KEY,
  fee_type        text NOT NULL,
  unit            text NOT NULL,
  rate_usd        numeric(10,4) NOT NULL,
  effective_from  date NOT NULL,
  effective_to    date,
  UNIQUE (fee_type, effective_from)
);

------------------------------------------------------------------------------
-- 5. Logistics fees (returns, refurb, disposal, special handling)
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.our_logistics_fees (
  id              bigserial PRIMARY KEY,
  fee_type        text NOT NULL,
  unit            text NOT NULL,
  rate_usd        numeric(10,4) NOT NULL,
  effective_from  date NOT NULL,
  effective_to    date,
  UNIQUE (fee_type, effective_from)
);

------------------------------------------------------------------------------
-- 6. Category benchmarks (Bull-tier peer cohort comparison)
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.category_benchmarks (
  id                  bigserial PRIMARY KEY,
  category            text NOT NULL,
  metric              text NOT NULL,
  value               numeric(14,4) NOT NULL,
  cohort_size         integer NOT NULL,
  effective_from      date NOT NULL,
  effective_to        date,
  UNIQUE (category, metric, effective_from)
);

------------------------------------------------------------------------------
-- All six are admin-managed only. Service role bypasses RLS; deny-all client.
------------------------------------------------------------------------------
ALTER TABLE public.zone_matrix          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.our_carrier_rates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_retail_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.our_warehousing_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.our_logistics_fees   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_benchmarks  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS zone_matrix_no_client          ON public.zone_matrix;
DROP POLICY IF EXISTS our_carrier_rates_no_client    ON public.our_carrier_rates;
DROP POLICY IF EXISTS carrier_retail_rates_no_client ON public.carrier_retail_rates;
DROP POLICY IF EXISTS our_warehousing_fees_no_client ON public.our_warehousing_fees;
DROP POLICY IF EXISTS our_logistics_fees_no_client   ON public.our_logistics_fees;
DROP POLICY IF EXISTS category_benchmarks_no_client  ON public.category_benchmarks;

CREATE POLICY zone_matrix_no_client
  ON public.zone_matrix          FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY our_carrier_rates_no_client
  ON public.our_carrier_rates    FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY carrier_retail_rates_no_client
  ON public.carrier_retail_rates FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY our_warehousing_fees_no_client
  ON public.our_warehousing_fees FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY our_logistics_fees_no_client
  ON public.our_logistics_fees   FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY category_benchmarks_no_client
  ON public.category_benchmarks  FOR ALL USING (false) WITH CHECK (false);

------------------------------------------------------------------------------
-- Drafts staged for the 4-step publish workflow (Phase B.2).
-- Created here in B.1 because the read-only UI shows draft counts.
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_card_drafts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name        text NOT NULL CHECK (table_name IN (
    'zone_matrix','our_carrier_rates','carrier_retail_rates',
    'our_warehousing_fees','our_logistics_fees','category_benchmarks'
  )),
  draft_payload     jsonb NOT NULL,
  validation_result jsonb,
  impact_preview    jsonb,
  status            text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','discarded')),
  created_by        uuid REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_card_drafts_table_status_idx
  ON public.rate_card_drafts (table_name, status);

CREATE TABLE IF NOT EXISTS public.scheduled_publishes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name     text NOT NULL,
  draft_id       uuid NOT NULL REFERENCES public.rate_card_drafts(id) ON DELETE CASCADE,
  effective_from date NOT NULL,
  scheduled_by   uuid REFERENCES auth.users(id),
  scheduled_at   timestamptz NOT NULL DEFAULT now(),
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','cancelled'))
);
CREATE INDEX IF NOT EXISTS scheduled_publishes_pending_idx
  ON public.scheduled_publishes (effective_from)
  WHERE status = 'pending';

ALTER TABLE public.rate_card_drafts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_publishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rate_card_drafts_no_client    ON public.rate_card_drafts;
DROP POLICY IF EXISTS scheduled_publishes_no_client ON public.scheduled_publishes;

CREATE POLICY rate_card_drafts_no_client
  ON public.rate_card_drafts    FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY scheduled_publishes_no_client
  ON public.scheduled_publishes FOR ALL USING (false) WITH CHECK (false);
