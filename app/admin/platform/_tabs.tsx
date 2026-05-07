'use client';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { TabBar } from '@/components/ui/tab-bar';

const TABS = ['Flags', 'Kill switch', 'Model pins', 'News queue', 'Quotas'];

export function PlatformTabs({ active }: { active: string }) {
  const router = useRouter();
  return (
    <TabBar
      tabs={TABS}
      active={active}
      onSelect={(t) => router.push(`/admin/platform?tab=${encodeURIComponent(t)}` as Route)}
    />
  );
}
