import 'server-only';
import { adminClient } from '@/lib/supabase/admin';

export type KpiResult = { value: number | string; label: string; degraded?: boolean };

async function safeCount(table: string, filter?: (q: any) => any): Promise<number | null> {
  try {
    const supabase = adminClient();
    let q = supabase.from(table).select('*', { count: 'exact', head: true });
    if (filter) q = filter(q);
    const { count, error } = await q;
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

async function safeSum(table: string, column: string, filter?: (q: any) => any): Promise<number | null> {
  try {
    const supabase = adminClient();
    let q = supabase.from(table).select(column);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error || !data) return null;
    const rows = data as unknown as Array<Record<string, unknown>>;
    return rows.reduce((acc, r) => acc + (Number(r[column]) || 0), 0);
  } catch {
    return null;
  }
}

export async function fetchMrr(): Promise<KpiResult> {
  const sum = await safeSum('subscriptions', 'mrr', (q) => q.eq('status', 'active'));
  return sum == null
    ? { value: '—', label: 'MRR', degraded: true }
    : { value: `$${sum.toLocaleString()}`, label: 'MRR' };
}

export async function fetchActiveOrgs(): Promise<KpiResult> {
  const c = await safeCount('orgs', (q) => q.eq('status', 'active'));
  return c == null
    ? { value: '—', label: 'ACTIVE ORGS', degraded: true }
    : { value: c.toLocaleString(), label: 'ACTIVE ORGS' };
}

export async function fetchSignups30d(): Promise<KpiResult> {
  const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const c = await safeCount('orgs', (q) => q.gte('created_at', cutoff));
  return c == null
    ? { value: '—', label: 'SIGNUPS 30D', degraded: true }
    : { value: c.toLocaleString(), label: 'SIGNUPS 30D' };
}

export async function fetchCalfToCowRate(): Promise<KpiResult> {
  try {
    const supabase = adminClient();
    const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const [upgradeRes, signupRes] = await Promise.all([
      supabase
        .from('subscription_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'upgrade')
        .eq('from_tier', 'calf')
        .gte('created_at', cutoff),
      supabase
        .from('subscription_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'calf_signup')
        .gte('created_at', cutoff),
    ]);
    if (upgradeRes.error || signupRes.error) {
      return { value: '—', label: 'CALF→COW', degraded: true };
    }
    const u = upgradeRes.count ?? 0;
    const s = signupRes.count ?? 0;
    if (s === 0) return { value: '0%', label: 'CALF→COW' };
    return { value: `${Math.round((u / s) * 100)}%`, label: 'CALF→COW' };
  } catch {
    return { value: '—', label: 'CALF→COW', degraded: true };
  }
}

export async function fetchChurnRisk(): Promise<KpiResult> {
  try {
    const supabase = adminClient();
    const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { count, error } = await supabase
      .from('mv_org_cost_summary')
      .select('*', { count: 'exact', head: true })
      .lt('last_upload_at', cutoff);
    if (error) return { value: '—', label: 'CHURN RISK', degraded: true };
    return { value: (count ?? 0).toLocaleString(), label: 'CHURN RISK' };
  } catch {
    return { value: '—', label: 'CHURN RISK', degraded: true };
  }
}

export async function fetchFailedPayments(): Promise<KpiResult> {
  const c = await safeCount('subscriptions', (q) => q.eq('status', 'payment_failed'));
  return c == null
    ? { value: '—', label: 'FAILED PAYMENTS', degraded: true }
    : { value: c.toLocaleString(), label: 'FAILED PAYMENTS' };
}

export type MrrSeriesPoint = { month: string; new_mrr: number; expansion_mrr: number; churned_mrr: number };

export async function fetchMrrSeries(): Promise<MrrSeriesPoint[]> {
  try {
    const supabase = adminClient();
    const cutoff = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString();
    const { data, error } = await supabase
      .from('subscription_events')
      .select('created_at, new_mrr, expansion_mrr, churned_mrr')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    const buckets = new Map<string, MrrSeriesPoint>();
    for (const row of data) {
      const r = row as { created_at: string; new_mrr: number | null; expansion_mrr: number | null; churned_mrr: number | null };
      const month = r.created_at.slice(0, 7);
      const cur = buckets.get(month) ?? { month, new_mrr: 0, expansion_mrr: 0, churned_mrr: 0 };
      cur.new_mrr += Number(r.new_mrr) || 0;
      cur.expansion_mrr += Number(r.expansion_mrr) || 0;
      cur.churned_mrr += Number(r.churned_mrr) || 0;
      buckets.set(month, cur);
    }
    return Array.from(buckets.values()).sort((a, b) => a.month.localeCompare(b.month));
  } catch {
    return [];
  }
}

export type FunnelStages = {
  calf_signups: number;
  first_uploads: number;
  upgraded_to_cow: number;
  degraded: boolean;
};

export async function fetchFunnel(): Promise<FunnelStages> {
  try {
    const supabase = adminClient();
    const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const [signupsRes, uploadsRes, upgradesRes] = await Promise.all([
      supabase
        .from('subscription_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'calf_signup')
        .gte('created_at', cutoff),
      supabase
        .from('subscription_events')
        .select('org_id', { count: 'exact', head: true })
        .eq('event_type', 'first_upload')
        .gte('created_at', cutoff),
      supabase
        .from('subscription_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'upgrade')
        .eq('from_tier', 'calf')
        .gte('created_at', cutoff),
    ]);
    if (signupsRes.error || uploadsRes.error || upgradesRes.error) {
      return { calf_signups: 0, first_uploads: 0, upgraded_to_cow: 0, degraded: true };
    }
    return {
      calf_signups: signupsRes.count ?? 0,
      first_uploads: uploadsRes.count ?? 0,
      upgraded_to_cow: upgradesRes.count ?? 0,
      degraded: false,
    };
  } catch {
    return { calf_signups: 0, first_uploads: 0, upgraded_to_cow: 0, degraded: true };
  }
}

export type FailedPaymentRow = {
  org_id: string;
  org_name: string;
  mrr: number | null;
  stripe_customer_id: string | null;
  decline_code: string | null;
  updated_at: string;
};

export async function fetchFailedPaymentQueue(): Promise<FailedPaymentRow[]> {
  try {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('org_id, mrr, stripe_customer_id, updated_at, orgs!inner(name)')
      .eq('status', 'payment_failed')
      .order('updated_at', { ascending: false })
      .limit(50);
    if (error || !data) return [];
    return (data as Array<Record<string, unknown>>).map((r) => ({
      org_id: r.org_id as string,
      org_name: (r.orgs as { name?: string } | null)?.name ?? '—',
      mrr: (r.mrr as number) ?? null,
      stripe_customer_id: (r.stripe_customer_id as string) ?? null,
      decline_code: null,
      updated_at: r.updated_at as string,
    }));
  } catch {
    return [];
  }
}
