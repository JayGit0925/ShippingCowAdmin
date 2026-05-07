'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { BRAND } from '@/lib/brand';
import { Button } from '@/components/ui/button';

const AUDIT_ACTIONS = [
  'IMPERSONATE_USER',
  'IMPERSONATE_USER_END',
  'SUSPEND_ORG',
  'REACTIVATE_ORG',
  'DEACTIVATE_ORG',
  'TIER_OVERRIDE',
  'FORCE_LOGOUT_USER',
  'RESET_MFA',
  'TRANSFER_OWNERSHIP',
  'CCPA_ERASURE',
  'RATE_CARD_DRAFT_CREATE',
  'RATE_CARD_DRAFT_UPDATE',
  'RATE_CARD_DRAFT_DISCARD',
  'RATE_CARD_PUBLISH',
  'RATE_CARD_ROLLBACK',
  'RATE_CARD_SCHEDULE',
  'RATE_CARD_CSV_IMPORT',
  'NEWS_CARD_PUBLISH',
  'NEWS_CARD_RETIRE',
  'CONVERSATION_VIEW_START',
  'CONVERSATION_VIEW_END',
  'AI_KILL_SWITCH_TOGGLE',
  'AI_SUSPEND_ORG',
  'FEATURE_FLAG_CHANGE',
  'MODEL_PIN_SET',
  'MODEL_PIN_REMOVED',
  'QUOTA_OVERRIDE',
  'COUPON_APPLIED',
  'SUBSCRIPTION_CANCELLED',
  'PAYMENT_RETRY',
  'REFUND_INITIATED',
  'ADMIN_CREATED',
  'ADMIN_DELETED',
  'ADMIN_NOTE_CREATED',
  'TICKET_CREATED',
  'TICKET_REPLIED',
  'TICKET_STATUS_CHANGED',
  'TICKET_PRIORITY_CHANGED',
  'TICKET_ASSIGNED',
] as const;

export function AuditFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [action, setAction] = useState(sp.get('action') ?? '');
  const [actorId, setActorId] = useState(sp.get('actorId') ?? '');
  const [orgId, setOrgId] = useState(sp.get('orgId') ?? '');
  const [resourceType, setResourceType] = useState(sp.get('resourceType') ?? '');
  const [from, setFrom] = useState(sp.get('from') ?? '');
  const [to, setTo] = useState(sp.get('to') ?? '');

  function apply(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (action) params.set('action', action);
    if (actorId) params.set('actorId', actorId);
    if (orgId) params.set('orgId', orgId);
    if (resourceType) params.set('resourceType', resourceType);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    router.push(`/admin/audit?${params.toString()}`);
  }

  const inputStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    padding: '6px 10px',
    border: `3px solid ${BRAND.charcoal}`,
    background: BRAND.white,
    color: BRAND.charcoal,
    outline: 'none',
    borderRadius: 0,
  };

  return (
    <form
      onSubmit={apply}
      style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}
    >
      <select
        value={action}
        onChange={(e) => setAction(e.target.value)}
        style={{ ...inputStyle, minWidth: 200 }}
      >
        <option value="">All actions</option>
        {AUDIT_ACTIONS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      <input
        placeholder="Actor ID"
        value={actorId}
        onChange={(e) => setActorId(e.target.value)}
        style={{ ...inputStyle, minWidth: 160 }}
      />
      <input
        placeholder="Org ID"
        value={orgId}
        onChange={(e) => setOrgId(e.target.value)}
        style={{ ...inputStyle, minWidth: 160 }}
      />
      <input
        placeholder="Resource type"
        value={resourceType}
        onChange={(e) => setResourceType(e.target.value)}
        style={{ ...inputStyle, minWidth: 140 }}
      />
      <input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        style={inputStyle}
      />
      <input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        style={inputStyle}
      />
      <Button variant="blue" size="sm">
        Apply
      </Button>
    </form>
  );
}
