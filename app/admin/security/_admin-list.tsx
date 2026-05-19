'use client';
import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/lib/brand';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button } from '@/components/ui/button';

type AdminRow = {
  user_id?: unknown;
  role?: unknown;
  is_active?: unknown;
  created_at?: unknown;
  created_by?: unknown;
};

const inputStyle: CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  padding: '6px 10px',
  border: `3px solid ${BRAND.charcoal}`,
  background: BRAND.white,
  color: BRAND.charcoal,
  outline: 'none',
  borderRadius: 0,
};

const ROLES = ['super-admin', 'support-admin', 'billing-admin'] as const;
type RoleValue = (typeof ROLES)[number];

function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function asBool(v: unknown): boolean {
  return v === true;
}

export function AdminList({ admins }: { admins: Array<Record<string, unknown>> }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<RoleValue>('support-admin');
  // Typed confirmation state: userId being deactivated → typed text
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  function startDeactivate(userId: string) {
    setConfirmingId(userId);
    setConfirmText('');
    setErr(null);
  }

  function cancelDeactivate() {
    setConfirmingId(null);
    setConfirmText('');
  }

  async function confirmDeactivate() {
    if (!confirmingId) return;
    setBusy(confirmingId);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/security/admins/${confirmingId}/deactivate`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setErr(data?.error ?? `HTTP ${res.status}`);
        return;
      }
      setConfirmingId(null);
      setConfirmText('');
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function addAdmin() {
    if (!newUserId.trim()) {
      setErr('user_id required');
      return;
    }
    setBusy('__new');
    setErr(null);
    try {
      const res = await fetch('/api/admin/security/admins', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ user_id: newUserId.trim(), role: newRole, is_active: true }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setErr(data?.error ?? `HTTP ${res.status}`);
        return;
      }
      setNewUserId('');
      setNewRole('support-admin');
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {err ? (
        <div
          style={{
            border: `3px solid ${BRAND.red}`,
            color: BRAND.red,
            padding: '8px 12px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            background: BRAND.white,
          }}
        >
          {err}
        </div>
      ) : null}

      {admins.length === 0 ? (
        <Card style={{ padding: 14 }}>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: BRAND.charcoal,
              margin: 0,
            }}
          >
            No platform admins on file.
          </p>
        </Card>
      ) : (
        admins.map((rawRow) => {
          const row = rawRow as AdminRow;
          const userId = asString(row.user_id);
          const role = asString(row.role);
          const isActive = asBool(row.is_active);
          const createdAt = asString(row.created_at);
          return (
            <Card key={userId || Math.random()} style={{ padding: 14 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: 10,
                      color: BRAND.blue,
                      marginBottom: 6,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {userId ? userId.slice(0, 8) : '—'}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      color: BRAND.charcoal,
                    }}
                  >
                    <span>
                      <strong>Role:</strong> {role || '—'}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: 9,
                        padding: '3px 7px',
                        background: isActive ? '#BBF7D0' : '#FEE2E2',
                        color: isActive ? '#166534' : '#991B1B',
                        border: `2px solid ${BRAND.charcoal}`,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <span style={{ fontSize: 12 }}>
                      Created: {createdAt ? createdAt.slice(0, 10) : '—'}
                    </span>
                  </div>
                </div>
                {isActive && userId ? (
                  confirmingId === userId ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        alignItems: 'flex-end',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 12,
                          color: BRAND.charcoal,
                          margin: 0,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Type <code style={{ background: BRAND.pageBed, border: `2px solid ${BRAND.charcoal}`, padding: '1px 4px', fontSize: 12 }}>DEACTIVATE</code> to confirm
                      </p>
                      <input
                        placeholder="DEACTIVATE"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        style={{ ...inputStyle, width: 160 }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button variant="ghost" size="sm" onClick={cancelDeactivate}>
                          Cancel
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={confirmDeactivate}
                          disabled={confirmText !== 'DEACTIVATE' || busy === userId}
                        >
                          {busy === userId ? 'Working…' : 'Confirm'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => startDeactivate(userId)}
                      disabled={busy === userId}
                    >
                      Deactivate
                    </Button>
                  )
                ) : null}
              </div>
            </Card>
          );
        })
      )}

      <Card style={{ padding: 14 }}>
        <Eyebrow>{'// ADD ADMIN'}</Eyebrow>
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexWrap: 'wrap',
            marginTop: 6,
          }}
        >
          <input
            placeholder="user_id (uuid)"
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            style={{ ...inputStyle, minWidth: 280, flex: '1 1 280px' }}
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as RoleValue)}
            style={{ ...inputStyle, minWidth: 180 }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            size="sm"
            onClick={addAdmin}
            disabled={busy === '__new' || !newUserId.trim()}
          >
            Add admin
          </Button>
        </div>
      </Card>
    </div>
  );
}
