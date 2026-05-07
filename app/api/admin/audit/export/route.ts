import { fetchAudit, toCsv } from '@/lib/audit-search';
import type { AuditEntry } from '@/lib/audit-search';
import { getAdminContext } from '@/lib/admin-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await getAdminContext(req);
  } catch (resp) {
    if (resp instanceof Response) return resp;
    throw resp;
  }
  const url = new URL(req.url);
  const get = (k: string) => url.searchParams.get(k) ?? undefined;
  const all: AuditEntry[] = [];
  let page = 0;
  while (all.length < 10000) {
    const res = await fetchAudit({
      action: get('action'),
      actorId: get('actorId'),
      orgId: get('orgId'),
      resourceType: get('resourceType'),
      from: get('from'),
      to: get('to'),
      page,
      pageSize: 500,
    });
    all.push(...res.rows);
    if (res.rows.length < 500) break;
    page++;
  }
  const csv = toCsv(all);
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="audit-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
