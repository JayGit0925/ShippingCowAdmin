import { Eyebrow } from '@/components/ui/eyebrow';
import { Card } from '@/components/ui/card';
import { BRAND } from '@/lib/brand';
import { adminClient } from '@/lib/supabase/admin';
import { AdminList } from './_admin-list';
import { SuspiciousSessions } from './_suspicious-sessions';
import { CcpaForm } from './_ccpa-form';

export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  const supabase = adminClient();
  const { data: admins } = await supabase
    .from('platform_admins')
    .select('user_id, role, is_active, created_at, created_by')
    .order('created_at', { ascending: false });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>{'// SECURITY'}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.charcoal,
            textTransform: 'uppercase',
          }}
        >
          Security
        </h1>
      </div>
      <section>
        <Eyebrow>{'// ADMINS'}</Eyebrow>
        <AdminList admins={(admins ?? []) as Array<Record<string, unknown>>} />
      </section>
      <section>
        <Eyebrow>{'// SUSPICIOUS SESSIONS'}</Eyebrow>
        <SuspiciousSessions />
      </section>
      <section>
        <Eyebrow>{'// CCPA / GDPR ERASURE'}</Eyebrow>
        <Card style={{ padding: 18 }}>
          <CcpaForm />
        </Card>
      </section>
    </div>
  );
}
