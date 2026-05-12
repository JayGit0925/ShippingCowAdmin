'use client';

import { type CSSProperties } from 'react';
import { BRAND } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import { browserClient } from '@/lib/supabase/browser';

const eyebrowStyle: CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 9,
  color: BRAND.charcoal,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  marginBottom: 8,
  display: 'block',
  opacity: 0.5,
};

export default function LoginPage() {
  const supabase = browserClient();

  async function onGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: BRAND.pageBed,
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
        <span style={eyebrowStyle}>{'// ADMIN'}</span>
        <h1
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 28,
            textTransform: 'uppercase',
            color: BRAND.charcoal,
            marginBottom: 8,
            letterSpacing: '0.02em',
          }}
        >
          ShippingCow Admin
        </h1>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: BRAND.charcoal,
            marginBottom: 24,
            opacity: 0.65,
          }}
        >
          Platform admins only.
        </p>
        <Button variant="blue" size="lg" onClick={onGoogleSignIn} style={{ width: '100%' }}>
          Sign in with Google
        </Button>
      </div>
    </main>
  );
}
