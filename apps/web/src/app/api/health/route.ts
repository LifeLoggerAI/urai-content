import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'urai-content-web',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}
