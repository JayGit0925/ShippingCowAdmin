import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { BRAND } from '@/lib/brand';

export default function SetupMfaPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Eyebrow>{'// REQUIRED'}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            color: BRAND.red,
            textTransform: 'uppercase',
          }}
        >
          Set up MFA
        </h1>
      </div>
      <Card style={{ padding: 24 }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal }}>
          Supabase TOTP enrollment UI wired in Phase A.2. All admin routes blocked until enrollment complete.
        </p>
      </Card>
    </div>
  );
}
