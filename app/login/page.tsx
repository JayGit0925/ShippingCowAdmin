import { BRAND } from '@/lib/brand';
import { SUPABASE_CONFIGURED } from '@/lib/env';

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          background: BRAND.white,
          border: `3px solid ${BRAND.charcoal}`,
          boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
          padding: 32,
          maxWidth: 420,
          width: '100%',
        }}
      >
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 28,
            textTransform: 'uppercase',
            color: BRAND.charcoal,
            marginBottom: 12,
          }}
        >
          Admin Login
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal }}>
          {SUPABASE_CONFIGURED
            ? 'Supabase auth UI not yet wired (Phase A stub).'
            : 'DEV BYPASS active — Supabase env vars not set. Navigate directly to /admin.'}
        </p>
      </div>
    </main>
  );
}
