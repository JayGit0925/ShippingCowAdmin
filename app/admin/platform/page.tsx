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
  let news: Array<{ id: string; headline: string; approval_state: string; created_at: string }> = [];
  try {
    const { data } = await supabase
      .from('news_items')
      .select('id, headline, approval_state, created_at')
      .eq('approval_state', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);
    news = (data ?? []) as typeof news;
  } catch {
    /* news_items absent */
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>{'// PLATFORM CONTROLS'}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          Platform
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
        <QuotaPanel />
      )}
    </div>
  );
}
