import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/brand';
import { adminClient } from '@/lib/supabase/admin';
import { SUPABASE_CONFIGURED } from '@/lib/env';
import { fetchOrg } from '@/lib/customers';
import { DrawerTabs } from './_drawer-tabs';
import { ConfirmActionButton } from './_confirm-action';

export const dynamic = 'force-dynamic';

type Note = { id: string; note: string; created_at: string; created_by: string | null };
type Audit = {
  id: string;
  occurred_at: string;
  action: string;
  actor_user_id: string;
  reason: string | null;
};
type MemberRow = {
  user_id: string;
  last_login: string | null;
};

export default async function OrgDrawerPage({
  params,
}: {
  params: { orgId: string };
}) {
  if (!SUPABASE_CONFIGURED) notFound();
  const org = await fetchOrg(params.orgId);
  if (!org) notFound();

  const supabase = adminClient();
  const [notesRes, auditRes, membersRes] = await Promise.all([
    supabase
      .from('admin_notes')
      .select('id, note, created_at, created_by')
      .eq('org_id', params.orgId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('audit_log')
      .select('id, occurred_at, action, actor_user_id, reason')
      .eq('org_id', params.orgId)
      .order('occurred_at', { ascending: false })
      .limit(100),
    supabase
      .from('org_members')
      .select('user_id, last_login')
      .eq('org_id', params.orgId),
  ]);

  const notes = (notesRes.data ?? []) as Note[];
  const audit = (auditRes.data ?? []) as Audit[];
  const members = (membersRes.data ?? []) as MemberRow[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Eyebrow>
          <Link href="/admin/customers" style={{ color: BRAND.blue, textDecoration: 'none' }}>
            {'« CUSTOMERS'}
          </Link>
          {' / '}
          {org.name.toUpperCase()}
        </Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          {org.name}
        </h1>
        <p
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 9,
            color: BRAND.charcoal,
            marginTop: 6,
            letterSpacing: '0.04em',
          }}
        >
          {[
            org.tier ? `TIER ${org.tier.toUpperCase()}` : null,
            org.status ? `STATUS ${org.status.toUpperCase()}` : null,
            org.mrr != null ? `MRR $${org.mrr.toLocaleString()}` : null,
            org.origin_zip ? `ZIP ${org.origin_zip}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>

      {/* Quick action buttons — 5 required: Suspend · Reactivate · Override Tier · Add Note · Impersonate */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <ConfirmActionButton
          orgId={org.id}
          orgName={org.name}
          action="suspend"
          label="Suspend"
          variant="danger"
          confirmWord="SUSPEND"
          description="Suspending this org will immediately block all logins and shipment creation. This action is logged and reversible."
        />
        <ActionForm action="reactivate" orgId={org.id} label="Reactivate" variant="primary" />
        <ConfirmActionButton
          orgId={org.id}
          orgName={org.name}
          action="tier-override"
          label="Override Tier"
          variant="ghost"
          confirmWord="OVERRIDE"
          description="Manually overriding the tier bypasses normal billing tier logic. This action is logged and may affect pricing."
        />
        <AddNoteButton orgId={org.id} />
        <ActionForm action="impersonate" orgId={org.id} label="Impersonate" variant="dark" />
      </div>

      <DrawerTabs
        panels={{
          Overview: (
            <Card style={{ padding: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal, margin: 0 }}>
                  {`${org.members} member${org.members === 1 ? '' : 's'}. Last active: ${
                    org.last_active ? new Date(org.last_active).toISOString().slice(0, 10) : '—'
                  }.`}
                </p>
                <MembersTable members={members} />
              </div>
            </Card>
          ),
          Activity: (
            <Card style={{ padding: 0 }}>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {audit.map((r) => (
                  <li
                    key={r.id}
                    style={{
                      padding: '10px 14px',
                      borderBottom: `1px solid ${BRAND.sky}`,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      color: BRAND.charcoal,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: 8,
                        color: BRAND.blue,
                        marginRight: 8,
                      }}
                    >
                      {new Date(r.occurred_at).toISOString().slice(0, 16).replace('T', ' ')}
                    </span>
                    <strong>{r.action}</strong>
                    {r.reason ? ` — ${r.reason}` : ''}
                  </li>
                ))}
                {audit.length === 0 ? (
                  <li
                    style={{
                      padding: 24,
                      textAlign: 'center',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      color: BRAND.charcoal,
                    }}
                  >
                    No activity yet.
                  </li>
                ) : null}
              </ul>
            </Card>
          ),
          Usage: (
            <Card style={{ padding: 18 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal, margin: 0 }}>
                No usage data yet.
              </p>
            </Card>
          ),
          Subscriptions: (
            <Card style={{ padding: 18 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal, margin: 0 }}>
                No subscription data yet.
              </p>
            </Card>
          ),
          Notes: <NotesPanel orgId={org.id} notes={notes} />,
        }}
      />
    </div>
  );
}

function ActionForm({
  orgId,
  action,
  label,
  variant,
}: {
  orgId: string;
  action: string;
  label: string;
  variant: 'primary' | 'blue' | 'ghost' | 'danger' | 'dark';
}) {
  return (
    <form action={`/api/admin/orgs/${orgId}/${action}` as Route} method="post">
      <Button variant={variant} size="sm">
        {label}
      </Button>
    </form>
  );
}

function AddNoteButton({ orgId }: { orgId: string }) {
  return (
    <form action={`/api/admin/orgs/${orgId}/note` as Route} method="post">
      <Button variant="ghost" size="sm">
        Add Note
      </Button>
    </form>
  );
}

function MembersTable({ members }: { members: MemberRow[] }) {
  if (members.length === 0) return null;
  return (
    <div>
      <Eyebrow style={{ marginBottom: 8 }}>// MEMBERS</Eyebrow>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {members.map((m) => (
          <li
            key={m.user_id}
            style={{
              padding: '8px 0',
              borderBottom: `1px solid ${BRAND.sky}`,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: BRAND.charcoal,
            }}
          >
            <code>{m.user_id}</code> · last login{' '}
            {m.last_login ? new Date(m.last_login).toISOString().slice(0, 16) : '—'}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotesPanel({ orgId, notes }: { orgId: string; notes: Note[] }) {
  return (
    <Card style={{ padding: 14 }}>
      <form
        action={`/api/admin/orgs/${orgId}/note` as Route}
        method="post"
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <textarea
          name="note"
          required
          placeholder="Add internal note…"
          rows={3}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            padding: 10,
            border: `3px solid ${BRAND.charcoal}`,
            background: BRAND.white,
            outline: 'none',
            borderRadius: 0,
          }}
        />
        <div>
          <Button variant="primary" size="sm">
            Save note
          </Button>
        </div>
      </form>
      <ul
        style={{
          margin: '14px 0 0 0',
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {notes.map((n) => (
          <li
            key={n.id}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: BRAND.charcoal,
              borderTop: `1px solid ${BRAND.sky}`,
              paddingTop: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                color: BRAND.charcoal,
                marginRight: 8,
              }}
            >
              {new Date(n.created_at).toISOString().slice(0, 10)}
            </span>
            {n.note}
          </li>
        ))}
        {notes.length === 0 ? (
          <li
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: BRAND.charcoal,
              opacity: 0.7,
            }}
          >
            No notes yet.
          </li>
        ) : null}
      </ul>
    </Card>
  );
}
