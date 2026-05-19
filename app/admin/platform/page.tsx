import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';
import { adminClient } from '@/lib/supabase/admin';
import { fetchFlags } from '@/lib/feature-flags';
import { FlagList } from './_flag-list';
import { KillSwitchPanel } from './_kill-switch';
import { ModelPinsPanel } from './_model-pins';
import { NewsQueuePanel } from './_news-queue';
import { QuotaPanel } from './_quota-panel';
import { PlatformTabs } from './_tabs';

export const dynamic = 'force-dynamic';

const TABS = ['Flags', 'Kill switch', 'Model pins', 'News queue', 'Quotas'] as const;

export default async function PlatformPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const tab = (typeof searchParams.tab === 'string' ? searchParams.tab : 'Flags') as
    | (typeof TABS)[number];

  const supabase = adminClient();
  const flags = await fetchFlags();
  const killSwitch = flags.find((f) => f.flag_key === 'mooovy_enabled') ?? null;
  const { data: pins } = await supabase
    .from('model_pins')
    .select('*')
    .order('pinned_at', { ascending: false });
  let news: Array<{ id: string; headline: string; approval_state: string; created_at: string; severity?: string | null; category?: string | null; impact?: string | null }> = [];
  try {
    const { data } = await supabase
      .from('news_items')
      .select('id, headline, approval_state, created_at, severity, category, impact')
      .eq('approval_state', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);
    news = (data ?? []) as typeof news;
  } catch {
    /* news_items absent */
  }

  // Fetch quota data from orgs + subscriptions (cross-app tables; may not exist locally)
  type QuotaRow = {
    org_id: string;
    org_name: string;
    tier: string;
    mooovy_used: number;
    mooovy_limit: number;
    csv_used: number;
    csv_limit: number;
    silo_used_gb: number;
    silo_limit_gb: number;
    ai_suspended: boolean;
  };
  let quotas: QuotaRow[] = [];
  try {
    const { data: orgRows } = await supabase
      .from('orgs')
      .select('id, name, tier')
      .order('name');
    if (orgRows && orgRows.length > 0) {
      const orgIds = (orgRows as Array<{ id: string; name: string; tier: string }>).map((o) => o.id);
      const { data: subRows } = await supabase
        .from('subscriptions')
        .select('org_id, quota_override, ai_suspended, tier_override')
        .in('org_id', orgIds);
      const subMap = new Map(
        ((subRows ?? []) as Array<{ org_id: string; quota_override: Record<string, number> | null; ai_suspended: boolean | null; tier_override: Record<string, unknown> | null }>)
          .map((s) => [s.org_id, s]),
      );
      const TIER_LIMITS: Record<string, { mooovy: number; csv: number; silo: number }> = {
        bull: { mooovy: 300, csv: 5, silo: 50 },
        cow: { mooovy: 100, csv: 3, silo: 5 },
        calf: { mooovy: 30, csv: 1, silo: 1 },
      };
      quotas = (orgRows as Array<{ id: string; name: string; tier: string }>).map((org) => {
        const sub = subMap.get(org.id);
        const qo = sub?.quota_override ?? {};
        const defaults = TIER_LIMITS[org.tier] ?? TIER_LIMITS.calf;
        return {
          org_id: org.id,
          org_name: org.name,
          tier: org.tier,
          mooovy_used: 0,
          mooovy_limit: typeof qo.mooovy_turns === 'number' ? qo.mooovy_turns : defaults.mooovy,
          csv_used: 0,
          csv_limit: typeof qo.csv_parses === 'number' ? qo.csv_parses : defaults.csv,
          silo_used_gb: 0,
          silo_limit_gb: typeof qo.silo_storage_gb === 'number' ? qo.silo_storage_gb : defaults.silo,
          ai_suspended: sub?.ai_suspended ?? false,
        };
      });
    }
  } catch {
    /* orgs table absent — user-portal repo not connected */
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>{'// 05 — PLATFORM CONTROLS'}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          Platform Controls
        </h1>
      </div>
      <PlatformTabs active={tab} />
      {tab === 'Flags' ? (
        <FlagList flags={flags} />
      ) : tab === 'Kill switch' ? (
        <KillSwitchPanel current={killSwitch} />
      ) : tab === 'Model pins' ? (
        <ModelPinsPanel pins={(pins ?? []) as Array<Record<string, unknown>>} />
      ) : tab === 'News queue' ? (
        <NewsQueuePanel items={news} />
      ) : (
        <QuotaPanel quotas={quotas} />
      )}
    </div>
  );
}
