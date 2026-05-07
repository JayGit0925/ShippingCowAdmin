import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';
import { fetchOrgList, type OrgListFilters } from '@/lib/customers';
import { SUPABASE_CONFIGURED } from '@/lib/env';
import { CustomerFilters } from './_filters';
import { CustomerList } from './_list';

export const dynamic = 'force-dynamic';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters: OrgListFilters = {
    q: typeof searchParams.q === 'string' ? searchParams.q : undefined,
    tier: typeof searchParams.tier === 'string' ? (searchParams.tier as OrgListFilters['tier']) : undefined,
    status: typeof searchParams.status === 'string' ? (searchParams.status as OrgListFilters['status']) : undefined,
    churnRisk: searchParams.churn === '1',
  };

  if (!SUPABASE_CONFIGURED) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Eyebrow>{'// CUSTOMERS'}</Eyebrow>
        <Card style={{ padding: 24 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
            Supabase not configured.
          </p>
        </Card>
      </div>
    );
  }

  const { rows, total, upstreamMissing } = await fetchOrgList(filters);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>{'// CUSTOMERS'}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          Customers
        </h1>
      </div>
      {upstreamMissing ? (
        <Card style={{ padding: 24, border: `3px solid ${BRAND.amber}` }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal }}>
            <strong>Upstream tables missing.</strong> The user-portal repo&apos;s migrations
            (orgs/subscriptions/org_members) have not been applied to this Supabase project.
            The customers list will populate once the user portal is migrated.
          </p>
        </Card>
      ) : (
        <>
          <CustomerFilters />
          <p
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              color: BRAND.charcoal,
            }}
          >
            {`Showing ${rows.length.toLocaleString()} of ${total.toLocaleString()} orgs.`}
          </p>
          <CustomerList rows={rows} />
        </>
      )}
    </div>
  );
}
