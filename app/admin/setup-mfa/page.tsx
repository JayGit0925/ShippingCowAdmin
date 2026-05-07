'use client';

import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/brand';
import { browserClient } from '@/lib/supabase/browser';

type EnrollState = {
  factorId: string;
  qr: string;
  secret: string;
};

const inputStyle: CSSProperties = {
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 18,
  padding: '10px 12px',
  border: `3px solid ${BRAND.charcoal}`,
  background: BRAND.white,
  color: BRAND.charcoal,
  outline: 'none',
  width: '100%',
  letterSpacing: '0.4em',
  textAlign: 'center',
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

export default function SetupMfaPage() {
  const router = useRouter();
  const supabase = browserClient();

  const [enroll, setEnroll] = useState<EnrollState | null>(null);
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const { data: factors, error: listErr } =
          await supabase.auth.mfa.listFactors();
        if (listErr) throw listErr;

        const verified = (factors?.totp ?? []).find(
          (f) => f.status === 'verified',
        );
        if (verified) {
          router.push('/admin');
          router.refresh();
          return;
        }

        const unverified = (factors?.all ?? []).filter(
          (f) => f.factor_type === 'totp' && f.status !== 'verified',
        );
        for (const f of unverified) {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }

        const { data: en, error: enErr } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
        });
        if (enErr || !en) throw enErr ?? new Error('Enroll failed');

        if (cancelled) return;
        setEnroll({
          factorId: en.id,
          qr: en.totp.qr_code,
          secret: en.totp.secret,
        });
      } catch (ex) {
        if (!cancelled)
          setErr(ex instanceof Error ? ex.message : 'Enrollment failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    if (!enroll) return;
    setErr(null);
    setBusy(true);
    try {
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: enroll.factorId,
      });
      if (chErr || !ch) {
        setErr(chErr?.message ?? 'Challenge failed');
        return;
      }
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: enroll.factorId,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 560 }}>
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
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: BRAND.charcoal,
            marginTop: 4,
            opacity: 0.8,
          }}
        >
          Scan the QR with your authenticator app, then enter the 6-digit code to
          confirm. Admin access is blocked until enrollment completes.
        </p>
      </div>

      <Card style={{ padding: 24 }}>
        {loading ? (
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: BRAND.charcoal,
            }}
          >
            Generating enrollment…
          </p>
        ) : enroll ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                display: 'flex',
                gap: 24,
                alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  border: `3px solid ${BRAND.charcoal}`,
                  background: BRAND.white,
                  padding: 8,
                  boxShadow: `4px 4px 0 ${BRAND.charcoal}`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={enroll.qr}
                  alt="TOTP QR code"
                  width={192}
                  height={192}
                  style={{ display: 'block' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <Eyebrow>{'// MANUAL SECRET'}</Eyebrow>
                <code
                  style={{
                    display: 'block',
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: 11,
                    color: BRAND.charcoal,
                    background: BRAND.pageBed,
                    border: `3px solid ${BRAND.charcoal}`,
                    padding: '10px 12px',
                    marginTop: 6,
                    wordBreak: 'break-all',
                    lineHeight: 1.6,
                  }}
                >
                  {enroll.secret}
                </code>
              </div>
            </div>

            <form
              onSubmit={onVerify}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div>
                <label style={labelStyle} htmlFor="totp-code">
                  6-digit code
                </label>
                <input
                  id="totp-code"
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
                  style={inputStyle}
                />
              </div>
              {err ? <ErrorBanner message={err} /> : null}
              <Button
                variant="blue"
                size="lg"
                disabled={busy || code.length !== 6}
              >
                {busy ? 'Verifying…' : 'Verify and continue'}
              </Button>
            </form>
          </div>
        ) : (
          <ErrorBanner message={err ?? 'Could not start enrollment.'} />
        )}
      </Card>
    </div>
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
