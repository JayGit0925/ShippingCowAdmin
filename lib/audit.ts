import 'server-only';
import { adminClient } from '@/lib/supabase/admin';
import { SUPABASE_CONFIGURED } from '@/lib/env';

export type AuditAction =
  | 'IMPERSONATE_USER' | 'IMPERSONATE_USER_END'
  | 'SUSPEND_ORG' | 'REACTIVATE_ORG' | 'DEACTIVATE_ORG'
  | 'TIER_OVERRIDE' | 'FORCE_LOGOUT_USER' | 'RESET_MFA'
  | 'TRANSFER_OWNERSHIP' | 'CCPA_ERASURE'
  | 'RATE_CARD_DRAFT_CREATE' | 'RATE_CARD_DRAFT_UPDATE' | 'RATE_CARD_DRAFT_DISCARD'
  | 'RATE_CARD_PUBLISH' | 'RATE_CARD_ROLLBACK'
  | 'RATE_CARD_SCHEDULE' | 'RATE_CARD_CSV_IMPORT'
  | 'NEWS_CARD_PUBLISH' | 'NEWS_CARD_RETIRE'
  | 'CONVERSATION_VIEW_START' | 'CONVERSATION_VIEW_END'
  | 'AI_KILL_SWITCH_TOGGLE' | 'AI_SUSPEND_ORG'
  | 'FEATURE_FLAG_CHANGE' | 'QUOTA_OVERRIDE'
  | 'COUPON_APPLIED' | 'SUBSCRIPTION_CANCELLED'
  | 'PAYMENT_RETRY' | 'REFUND_INITIATED'
  | 'ADMIN_CREATED' | 'ADMIN_DELETED'
  | 'TICKET_CREATED' | 'TICKET_REPLIED' | 'TICKET_STATUS_CHANGED';

export type AdminRole = 'super-admin' | 'support-admin' | 'billing-admin' | 'system';

export interface AuditEntry {
  action: AuditAction;
  actorId: string;
  actorRole: AdminRole;
  orgId?: string;
  resourceType: string;
  resourceId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  ticketId?: string;
  ip?: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  if (!SUPABASE_CONFIGURED) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[audit:dev]', entry.action, entry.resourceId, entry.reason ?? '');
      return;
    }
    throw new Error('audit_log unavailable: Supabase not configured');
  }
  const { error } = await adminClient().from('audit_log').insert({
    action: entry.action,
    actor_user_id: entry.actorId,
    actor_role: entry.actorRole,
    org_id: entry.orgId,
    resource_type: entry.resourceType,
    resource_id: entry.resourceId,
    before_value: entry.before,
    after_value: entry.after,
    reason: entry.reason,
    ticket_id: entry.ticketId,
    ip_address: entry.ip,
  });
  if (error) throw new Error(`audit insert failed: ${error.message}`);
}
