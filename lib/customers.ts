import 'server-only';
import { adminClient } from '@/lib/supabase/admin';

export type OrgTier = 'calf' | 'cow' | 'bull';
export type OrgStatus = 'active' | 'suspended' | 'deactivated' | 'payment_failed';

export type OrgRow = {
  id: string;
  name: string;
  tier: OrgTier | null;
  mrr: number | null;
  members: number;
  shipments_30d: number;
  last_active: string | null;
  status: OrgStatus | null;
  origin_zip: string | null;
};

export type OrgListFilters = {
  q?: string;
  tier?: OrgTier;
  status?: OrgStatus;
  churnRisk?: boolean;
  limit?: number;
};

const DEFAULT_LIMIT = 100;

export async function fetchOrgList(
  filters: OrgListFilters = {},
): Promise<{ rows: OrgRow[]; total: number; upstreamMissing: boolean }> {
  const supabase = adminClient();

  // Probe orgs existence so we degrade gracefully if user-portal not migrated.
  const probe = await supabase.from('orgs').select('id', { count: 'exact', head: true });
  if (probe.error) {
    return { rows: [], total: 0, upstreamMissing: true };
  }

  // Fetch orgs first (always present in admin view), then enrich.
  let q = supabase
    .from('orgs')
    .select('id, name, status, origin_zip, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(filters.limit ?? DEFAULT_LIMIT);
  if (filters.q && filters.q.trim().length > 0) {
    q = q.ilike('name', `%${filters.q.trim()}%`);
  }
  if (filters.status) q = q.eq('status', filters.status);
  const { data: orgs, count, error } = await q;
  if (error) {
    return { rows: [], total: 0, upstreamMissing: true };
  }

  const orgList = (orgs ?? []) as Array<{
    id: string;
    name: string;
    status: OrgStatus | null;
    origin_zip: string | null;
  }>;
  const ids = orgList.map((o) => o.id);
  if (ids.length === 0) {
    return { rows: [], total: count ?? 0, upstreamMissing: false };
  }

  const [subsRes, membersRes] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('org_id, tier, mrr')
      .in('org_id', ids),
    supabase
      .from('org_members')
      .select('org_id, last_login')
      .in('org_id', ids),
  ]);
  const subs = (subsRes.data ?? []) as Array<{ org_id: string; tier: OrgTier; mrr: number }>;
  const members = (membersRes.data ?? []) as Array<{ org_id: string; last_login: string | null }>;

  const subBy = new Map(subs.map((s) => [s.org_id, s]));
  const memberCounts = new Map<string, number>();
  const lastActive = new Map<string, string | null>();
  for (const m of members) {
    memberCounts.set(m.org_id, (memberCounts.get(m.org_id) ?? 0) + 1);
    const prior = lastActive.get(m.org_id) ?? null;
    if (m.last_login && (!prior || m.last_login > prior)) {
      lastActive.set(m.org_id, m.last_login);
    }
  }

  const rows: OrgRow[] = orgList.map((o) => {
    const sub = subBy.get(o.id);
    return {
      id: o.id,
      name: o.name,
      tier: sub?.tier ?? null,
      mrr: sub?.mrr ?? null,
      members: memberCounts.get(o.id) ?? 0,
      shipments_30d: 0,
      last_active: lastActive.get(o.id) ?? null,
      status: o.status,
      origin_zip: o.origin_zip,
    };
  });

  let filtered = rows;
  if (filters.tier) filtered = filtered.filter((r) => r.tier === filters.tier);
  if (filters.churnRisk) filtered = filtered.filter((r) => r.shipments_30d === 0);

  return { rows: filtered, total: count ?? filtered.length, upstreamMissing: false };
}

export async function fetchOrg(id: string): Promise<OrgRow | null> {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from('orgs')
    .select('id, name, status, origin_zip')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  const [subRes, memRes] = await Promise.all([
    supabase.from('subscriptions').select('tier, mrr').eq('org_id', id).single(),
    supabase.from('org_members').select('last_login').eq('org_id', id),
  ]);
  const sub = subRes.data as { tier: OrgTier; mrr: number } | null;
  const members = (memRes.data ?? []) as Array<{ last_login: string | null }>;
  let last: string | null = null;
  for (const m of members) {
    if (m.last_login && (!last || m.last_login > last)) last = m.last_login;
  }
  return {
    id: data.id,
    name: data.name,
    tier: sub?.tier ?? null,
    mrr: sub?.mrr ?? null,
    members: members.length,
    shipments_30d: 0,
    last_active: last,
    status: data.status,
    origin_zip: data.origin_zip,
  };
}
