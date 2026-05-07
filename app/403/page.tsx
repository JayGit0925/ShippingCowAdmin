import { BRAND } from '@/lib/brand';

export default function ForbiddenPage() {
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
          border: `3px solid ${BRAND.red}`,
          boxShadow: `4px 4px 0 ${BRAND.red}`,
          padding: 32,
          maxWidth: 420,
        }}
      >
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 32,
            textTransform: 'uppercase',
            color: BRAND.red,
          }}
        >
          403 — Not Authorized
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: BRAND.charcoal, marginTop: 12 }}>
          This account is not in <code>platform_admins</code>.
        </p>
      </div>
    </main>
  );
}
