-- Phase B.2 — refresh_mv_org_cost_summary stub.
-- The materialized view `mv_org_cost_summary` lives in the user-portal repo,
-- not this one. This stub function lets the admin portal's publish path
-- attempt a refresh without crashing when the MV is absent.
--
-- The user-portal repo will overwrite this function with a real
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_org_cost_summary call once
-- that view is created.

CREATE OR REPLACE FUNCTION public.refresh_mv_org_cost_summary()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN
    EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_org_cost_summary';
    RETURN true;
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'mv_org_cost_summary does not exist; skipping refresh';
      RETURN false;
    WHEN feature_not_supported THEN
      EXECUTE 'REFRESH MATERIALIZED VIEW public.mv_org_cost_summary';
      RETURN true;
    WHEN others THEN
      RAISE NOTICE 'mv_org_cost_summary refresh skipped: %', SQLERRM;
      RETURN false;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_mv_org_cost_summary() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_mv_org_cost_summary() TO service_role;
