'use client';
import { useState, useRef } from 'react';
import { BRAND } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Card } from '@/components/ui/card';

interface ConfirmActionProps {
  orgId: string;
  orgName: string;
  action: 'suspend' | 'tier-override';
  label: string;
  variant: 'primary' | 'blue' | 'ghost' | 'danger' | 'dark';
  confirmWord: string;
  description: string;
}

export function ConfirmActionButton({
  orgId,
  orgName,
  action,
  label,
  variant,
  confirmWord,
  description,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    setTyped('');
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const confirmed = typed === confirmWord;

  return (
    <>
      <Button variant={variant} size="sm" onClick={handleOpen}>
        {label}
      </Button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(26,32,44,0.7)',
          }}
        >
          <Card style={{ width: 480, padding: 28, background: BRAND.white }}>
            <Eyebrow>// CONFIRM ACTION</Eyebrow>
            <div
              style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 20,
                color: BRAND.charcoal,
                textTransform: 'uppercase',
                margin: '8px 0 16px',
              }}
            >
              {label}: {orgName}
            </div>
            <div
              style={{
                background: '#FEF3C7',
                border: `3px solid ${BRAND.amber ?? '#F59E0B'}`,
                padding: 12,
                marginBottom: 16,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
              }}
            >
              {description}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Eyebrow style={{ marginBottom: 6 }}>
                // TYPE &ldquo;{confirmWord}&rdquo; TO CONFIRM
              </Eyebrow>
              <input
                ref={inputRef}
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={confirmWord}
                style={{
                  width: '100%',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  padding: '8px 10px',
                  border: `3px solid ${BRAND.charcoal}`,
                  outline: 'none',
                  background: BRAND.white,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <form action={`/api/admin/orgs/${orgId}/${action}`} method="post">
                <Button
                  variant={variant}
                  size="sm"
                  disabled={!confirmed}
                >
                  Confirm {label}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
