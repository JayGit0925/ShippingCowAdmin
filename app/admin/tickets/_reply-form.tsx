'use client';

import { useState } from 'react';
import type { Route } from 'next';
import { BRAND } from '@/lib/brand';
import { Button } from '@/components/ui/button';

export function ReplyForm({ ticketId }: { ticketId: string }) {
  const [mode, setMode] = useState<'public' | 'internal'>('public');

  return (
    <form
      action={`/api/admin/tickets/${ticketId}/reply` as Route}
      method="post"
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {/* Dual-mode toggle */}
      <div style={{ display: 'flex', gap: 4 }}>
        {(['public', 'internal'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8,
              padding: '6px 10px',
              border: `2px solid ${BRAND.charcoal}`,
              background: mode === m ? BRAND.charcoal : 'transparent',
              color: mode === m ? BRAND.white : BRAND.charcoal,
              cursor: 'pointer',
              letterSpacing: '0.03em',
              borderRadius: 0,
            }}
          >
            {m === 'public' ? 'PUBLIC' : 'INTERNAL NOTE'}
          </button>
        ))}
      </div>

      {/* Hidden field carries the resolved from_type */}
      <input type="hidden" name="from_type" value={mode === 'internal' ? 'note' : 'admin'} />

      <textarea
        name="body"
        required
        placeholder={
          mode === 'internal'
            ? 'Add an internal note (not visible to user)…'
            : 'Reply to user… (Cmd+Enter to send)'
        }
        rows={4}
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          padding: 10,
          border: `3px solid ${mode === 'internal' ? BRAND.amber : BRAND.charcoal}`,
          background: mode === 'internal' ? '#FFFBEA' : BRAND.white,
          outline: 'none',
          borderRadius: 0,
          color: BRAND.charcoal,
          lineHeight: 1.5,
          resize: 'vertical',
        }}
      />

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button
          variant="primary"
          size="sm"
          style={
            mode === 'internal'
              ? { background: BRAND.amber, borderColor: BRAND.amber, color: BRAND.charcoal }
              : undefined
          }
        >
          {mode === 'internal' ? 'Add Note' : 'Send Reply'}
        </Button>
      </div>
    </form>
  );
}
