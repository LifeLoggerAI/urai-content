import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    service: 'urai-content-web',
    appVersion: '0.1.0',
    packageName: 'urai-content',
    environment: process.env.NODE_ENV ?? 'unknown',
    // Next replaces this value with the source identity captured at build time.
    // Runtime environment variables do not certify a prebuilt artifact.
    commitSha: process.env.URAI_CONTENT_BUILD_SHA || null
  }, { headers: { 'Cache-Control': 'no-store' } });
}
