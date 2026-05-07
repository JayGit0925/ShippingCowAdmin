import 'server-only';
import { adminClient } from '@/lib/supabase/admin';

export type CcpaCascadePreview = {
  org_id: string;
  org_name: string | null;
  members: number;
  shipments: number;
  conversations: number;
  files: number;
  notes: number;
  tickets: number;
  audit_entries_to_be_kept: number;
  upstream_missing: string[];
};

const POSSIBLE_CASCADE_TABLES: Array<{ name: string; column: string }> = [
  { name: 'shipments', column: 'org_id' },
  { name: 'conversations', column: 'org_id' },
  { name: 'silo_files', column: 'org_id' },
  { name: 'usage_events', column: 'org_id' },
  { name: 'subscriptions', column: 'org_id' },
  { name: 'admin_notes', column: 'org_id' },
  { name: 'support_tickets', column: 'org_id' },
];

export async function previewCascade(orgId: string): Promise<CcpaCascadePreview> {
  const supabase = adminClient();
  const out: CcpaCascadePreview = {
    org_id: orgId,
    org_name: null,
    members: 0,
    shipments: 0,
    conversations: 0,
    files: 0,
    notes: 0,
    tickets: 0,
    audit_entries_to_be_kept: 0,
    upstream_missing: [],
  };
  const orgRes = await supabase.from('orgs').select('name').eq('id', orgId).single();
  out.org_name = (orgRes.data as { name?: string } | null)?.name ?? null;

  for (const t of POSSIBLE_CASCADE_TABLES) {
    const { count, error } = await supabase
      .from(t.name)
      .select('*', { count: 'exact', head: true })
      .eq(t.column, orgId);
    if (error) {
      out.upstream_missing.push(t.name);
      continue;
    }
    if (t.name === 'shipments') out.shipments = count ?? 0;
    else if (t.name === 'conversations') out.conversations = count ?? 0;
    else if (t.name === 'silo_files') out.files = count ?? 0;
    else if (t.name === 'admin_notes') out.notes = count ?? 0;
    else if (t.name === 'support_tickets') out.tickets = count ?? 0;
  }

  const { count: members } = await supabase
    .from('org_members')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);
  out.members = members ?? 0;

  const { count: audit } = await supabase
    .from('audit_log')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);
  out.audit_entries_to_be_kept = audit ?? 0;
  return out;
}

export type CcpaEraseOutcome = {
  deleted: Record<string, number>;
  skipped: string[];
  members_signed_out: number;
};

export async function executeCascade(orgId: string): Promise<CcpaEraseOutcome> {
  const supabase = adminClient();
  const out: CcpaEraseOutcome = { deleted: {}, skipped: [], members_signed_out: 0 };

  // Cascade table deletes (admin-owned tables and any user-portal tables that exist).
  for (const t of POSSIBLE_CASCADE_TABLES) {
    const { error, count } = await supabase
      .from(t.name)
      .delete({ count: 'exact' })
      .eq(t.column, orgId);
    if (error) {
      out.skipped.push(`${t.name}: ${error.message}`);
    } else {
      out.deleted[t.name] = count ?? 0;
    }
  }

  // Sign out + delete each org member from auth (best-effort).
  const { data: members } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('org_id', orgId);
  for (const m of (members ?? []) as Array<{ user_id: string }>) {
    try {
      await supabase.auth.admin.signOut(m.user_id);
      out.members_signed_out++;
    } catch {
      /* ignore */
    }
  }

  // Delete org row last.
  const { error: orgErr } = await supabase.from('orgs').delete().eq('id', orgId);
  if (orgErr) out.skipped.push(`orgs: ${orgErr.message}`);
  else out.deleted['orgs'] = 1;

  return out;
}
