import { createBrowserSession, clearBrowserSession } from '@/server/auth/browserSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = createBrowserSession;
export const DELETE = clearBrowserSession;

