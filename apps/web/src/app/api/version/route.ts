import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  // A Vercel --prebuilt runtime can lack system Git variables. This value is
  // inlined into the build, not inferred from an old deployment or hostname.
  const builtSha = process.env.URAI_CONTENT_COMPILED_SHA;
  const runtimeSha = process.env.VERCEL_GIT_COMMIT_SHA;
  const validBuild = typeof builtSha === 'string' && /^[a-f0-9]{40}$/.test(builtSha);
  // Fail closed if Vercel *does* supply a conflicting runtime provenance.
  const consistentRuntime = !runtimeSha || runtimeSha === builtSha;
  return NextResponse.json({
    service: 'urai-content-web',
    appVersion: '0.1.0',
    packageName: 'urai-content',
    environment: process.env.NODE_ENV ?? 'unknown',
    commitSha: validBuild && consistentRuntime ? builtSha : null
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
