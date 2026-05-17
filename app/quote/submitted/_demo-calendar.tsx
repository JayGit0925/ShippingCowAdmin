'use client';

import { getCalApi } from '@calcom/embed-react';
import { useEffect } from 'react';
import { CAL_NAMESPACE, CAL_SLUG } from '@/lib/cal';

export function DemoCalendar() {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      cal('ui', { hideEventTypeDetails: false, layout: 'month_view' });
    })();
  }, []);

  return (
    <div
      data-cal-namespace={CAL_NAMESPACE}
      data-cal-link={CAL_SLUG}
      data-cal-config='{"layout":"month_view"}'
      style={{ width: '100%', minHeight: 600 }}
    />
  );
}
