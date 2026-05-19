'use client';
import { useState, type ReactNode } from 'react';
import { TabBar } from '@/components/ui/tab-bar';

const TABS = ['Overview', 'Activity', 'Usage', 'Subscriptions', 'Notes'] as const;
type Tab = (typeof TABS)[number];

export function DrawerTabs({
  panels,
}: {
  panels: Record<Tab, ReactNode>;
}) {
  const [active, setActive] = useState<Tab>('Overview');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <TabBar
        tabs={TABS as unknown as string[]}
        active={active}
        onSelect={(t) => setActive(t as Tab)}
      />
      <div>{panels[active]}</div>
    </div>
  );
}
