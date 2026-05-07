import 'server-only';
import { adminClient } from '@/lib/supabase/admin';

export type AuditFilters = {
  action?: string;
  actorId?: string;
  orgId?: string;
  from?: string;
  to?: string;
  resourceType?: string;
  page?: number;
  pageSize?: number;
};

export type AuditEntry = {
  id: string;
  occurred_at: string;
  actor_user_id: string | null;
  actor_role: string | null;
  org_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  before_value: unknown;
  after_value: unknown;
  reason: string | null;
  ticket_id: string | null;
  ip_address: string | null;
};

export async function fetchAudit(
  f: AuditFilters,
): Promise<{ rows: AuditEntry[]; total: number; page: number; pageSize: number }> {
  const supabase = adminClient();
  const pageSize = Math.min(500, Math.max(10, f.pageSize ?? 100));
  const page = Math.max(0, f.page ?? 0);
  let q = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('occurred_at', { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);
  if (f.action) q = q.eq('action', f.action);
  if (f.actorId) q = q.eq('actor_user_id', f.actorId);
  if (f.orgId) q = q.eq('org_id', f.orgId);
  if (f.resourceType) q = q.eq('resource_type', f.resourceType);
  if (f.from) q = q.gte('occurred_at', f.from);
  if (f.to) q = q.lte('occurred_at', f.to);
  const { data, count, error } = await q;
  if (error) return { rows: [], total: 0, page, pageSize };
  return { rows: ((data ?? []) as AuditEntry[]), total: count ?? 0, page, pageSize };
}

export function toCsv(rows: AuditEntry[]): string {
  const headers = [
    'id',
    'occurred_at',
    'actor_user_id',
    'actor_role',
    'org_id',
    'action',
    'resource_type',
    'resource_id',
    'reason',
    'ticket_id',
    'ip_address',
  ];
  const escape = (v: unknown): string => {
    if (v == null) return '';
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => escape((r as Record<string, unknown>)[h])).join(','));
  }
  return lines.join('\n');
}
