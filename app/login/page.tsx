'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BRAND } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import { browserClient } from '@/lib/supabase/browser';

type Step = 'creds' | 'totp';

const inputStyle: CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  padding: '10px 12px',
  border: `3px solid ${BRAND.charcoal}`,
  background: BRAND.white,
  color: BRAND.charcoal,
  outline: 'none',
  width: '100%',
  borderRadius: 0,
};

const labelStyle: CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 9,
  color: BRAND.charcoal,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 6,
  display: 'block',
};

export default function LoginPage() {
  const router = useRouter();
  const supabase = browserClient();

  const [step, setStep] = useState<Step>('creds');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSignIn(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) {
        setErr(signInErr.message);
        return;
      }

      const { data: aalData, error: aalErr } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalErr) {
        setErr(aalErr.message);
        return;
      }

      const needsTotp =
        aalData?.nextLevel === 'aal2' && aalData.currentLevel === 'aal1';

      if (needsTotp) {
        const { data: factors, error: listErr } =
          await supabase.auth.mfa.listFactors();
        if (listErr) {
          setErr(listErr.message);
          return;
        }
        const verified = (factors?.totp ?? []).find(
          (f) => f.status === 'verified',
        );
        if (!verified) {
          router.push('/admin/setup-mfa');
          router.refresh();
          return;
        }
        setFactorId(verified.id);
        setStep('totp');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Unexpected error');
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyTotp(e: FormEvent) {
    e.preventDefault();
    if (!factorId) {
      setErr('Missing factor id');
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (chErr || !ch) {
        setErr(chErr?.message ?? 'Challenge failed');
        return;
      }
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: ch.id,
        code: code.trim(),
      });
      if (vErr) {
        setErr(vErr.message);
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Unexpected error');
    } finally {
      setBusy(false);
    }
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
          {step === 'creds' ? 'Admin Login' : 'Two-Factor Code'}
        </h1>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: BRAND.charcoal,
            marginBottom: 20,
            opacity: 0.75,
          }}
        >
          {step === 'creds'
            ? 'ShippingCow platform admins only.'
            : 'Enter the 6-digit code from your authenticator app.'}
        </p>

        {step === 'creds' ? (
          <form
            onSubmit={onSignIn}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <label style={labelStyle} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>
            {err ? <ErrorBanner message={err} /> : null}
            <Button variant="blue" size="lg" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={onVerifyTotp}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <label style={labelStyle} htmlFor="code">
                6-digit code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                autoComplete="one-time-code"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                style={{
                  ...inputStyle,
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 18,
                  letterSpacing: '0.4em',
                  textAlign: 'center',
                }}
              />
            </div>
            {err ? <ErrorBanner message={err} /> : null}
            <Button variant="blue" size="lg" disabled={busy || code.length !== 6}>
              {busy ? 'Verifying…' : 'Verify'}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        background: BRAND.red,
        color: BRAND.white,
        border: `3px solid ${BRAND.charcoal}`,
        padding: '8px 12px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
      }}
    >
      {message}
    </div>
  );
}
