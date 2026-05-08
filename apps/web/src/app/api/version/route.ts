import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    service: 'urai-content-web',
    appVersion: '0.1.0',
    packageName: 'urai-content',
    environment: process.env.NODE_ENV ?? 'unknown',
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null
  });
}
