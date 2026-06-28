import { NextResponse } from 'next/server';
import { getRuntimePersistenceStatus } from '@/server/content/service';

export const dynamic = 'force-dynamic';

export function GET() {
  const persistence = getRuntimePersistenceStatus();
  const status = persistence.productionSafe ? 'healthy' : 'degraded';

  return NextResponse.json({
    ok: persistence.productionSafe,
    service: 'urai-content-web',
    status,
    timestamp: new Date().toISOString(),
    persistence
  });
}
