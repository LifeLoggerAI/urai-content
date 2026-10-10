import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { createBrowserSession, clearBrowserSession, getBrowserSession, CONTENT_SESSION_COOKIE } from '../src/server/auth/browserSession';
import { getDashboardSnapshot } from '../src/server/content/dashboard';

const f = vi.hoisted(() => ({
  configured: true, verifyIdToken: vi.fn(), verifySessionCookie: vi.fn(),
  createSessionCookie: vi.fn(), getUser: vi.fn(), listEntitlements: vi.fn()
}));
vi.mock('server-only', () => ({}));
vi.mock('../src/server/firebase/admin', () => ({
  isFirebaseAdminConfigured: () => f.configured,
  getFirebaseAdminAuth: () => ({ verifyIdToken: f.verifyIdToken, verifySessionCookie: f.verifySessionCookie, createSessionCookie: f.createSessionCookie, getUser: f.getUser })
}));
vi.mock('../src/server/content/service', () => ({
  createRuntimeContentRepository: () => ({ listEntitlements: f.listEntitlements }),
  resetRuntimeMemoryRepositoryForTests: () => undefined
}));
const token = () => ({ uid: 'owner', role: 'user', entitlements: ['kept','old'], auth_time: Math.floor(Date.now()/1000) });
const account = () => ({ uid: 'owner', disabled: false, customClaims: { role: 'user', entitlements: ['kept','new'] } });
const grant = { userId: 'owner', entitlementKey: 'catalog:stories', grantedBy: 'admin', grantedAt: '2026-10-08T00:00:00.000Z', expiresAt: null };
function request(body: unknown = {idToken:'synthetic-id-token'}, headers: Record<string,string> = {}) {
  return new Request('https://www.uraicontent.com/api/auth/session', { method:'POST', headers:{origin:'https://www.uraicontent.com','content-type':'application/json',...headers}, body:JSON.stringify(body) });
}
beforeEach(() => {
  vi.stubEnv('NODE_ENV','production'); vi.stubEnv('NEXT_PUBLIC_SITE_URL','https://www.uraicontent.com');
  f.configured=true; for (const x of [f.verifyIdToken,f.verifySessionCookie,f.createSessionCookie,f.getUser,f.listEntitlements]) x.mockReset();
  f.verifyIdToken.mockResolvedValue(token());f.verifySessionCookie.mockResolvedValue(token());f.createSessionCookie.mockResolvedValue('synthetic-session-cookie');f.getUser.mockResolvedValue(account());f.listEntitlements.mockResolvedValue([grant]);
});
afterEach(() => vi.unstubAllEnvs());

it('exchanges a recent revoked-checked token for an HttpOnly same-site host cookie after fresh membership checks', async () => {
  const r=await createBrowserSession(request());
  expect(r.status).toBe(200);expect(await r.json()).toEqual({authenticated:true});
  expect(r.headers.get('set-cookie')).toBe(CONTENT_SESSION_COOKIE+'=synthetic-session-cookie; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600');
  expect(r.headers.get('cache-control')).toContain('no-store');
  expect(f.verifyIdToken).toHaveBeenCalledWith('synthetic-id-token',true);
  expect(f.createSessionCookie).toHaveBeenCalledWith('synthetic-id-token',{expiresIn:3600000});
  expect(f.verifySessionCookie).toHaveBeenCalledWith('synthetic-session-cookie',true);
  expect(f.getUser).toHaveBeenCalledTimes(2);
});
for(const [name,headers] of [
  ['foreign origin',{origin:'https://evil.example'}],['missing origin',{origin:''}],
  ['foreign fetch site',{'sec-fetch-site':'cross-site'}],['opaque origin',{origin:'null'}]
] as [string,Record<string,string>][]) it('denies '+name+' before provider execution',async()=>{
  expect((await createBrowserSession(request(undefined,headers))).status).toBe(403);expect(f.verifyIdToken).not.toHaveBeenCalled();
});
for(const [name,body] of [
  ['empty token',{idToken:''}],['extra fields',{idToken:'fixture',uid:'admin'}],['array',[]],['null',null],
  ['nonstring token',{idToken:3}],['overlong token',{idToken:'x'.repeat(8193)}],['oversized body',{idToken:'x'.repeat(17000)}]
]) it('denies '+name+' without reading provider state',async()=>{
  expect((await createBrowserSession(request(body))).status).toBe(400);expect(f.verifyIdToken).not.toHaveBeenCalled();
});
it('denies wrong MIME, malformed JSON and broken UTF8 without issuing a cookie',async()=>{
  expect((await createBrowserSession(request(undefined,{'content-type':'text/plain'}))).status).toBe(400);
  for(const body of ['{',new Uint8Array([255])]) {
    const r=new Request('https://www.uraicontent.com/api/auth/session',{method:'POST',headers:{origin:'https://www.uraicontent.com','content-type':'application/json'},body});
    expect((await createBrowserSession(r)).status).toBe(400);
  }
  expect(f.createSessionCookie).not.toHaveBeenCalled();
});
it('does not accept an unapproved production host or HTTP transport',async()=>{
  for(const url of ['https://preview.example/api/auth/session','http://www.uraicontent.com/api/auth/session']) {
    const r=new Request(url,{method:'POST',headers:{origin:new URL(url).origin,'content-type':'application/json'},body:JSON.stringify({idToken:'fixture'})});
    expect((await createBrowserSession(r)).status).toBe(403);
  }
});
it('missing Firebase config fails closed without an in-memory authentication substitute',async()=>{
  f.configured=false;expect((await createBrowserSession(request())).status).toBe(503);
  expect(await getBrowserSession('cookie')).toBeNull();expect(f.verifyIdToken).not.toHaveBeenCalled();
});
for(const [name,authTime] of [['old',()=>Math.floor(Date.now()/1000)-301],['future',()=>Math.floor(Date.now()/1000)+31],['fractional',()=>1.5],['missing',()=>undefined]] as const) it('requires recent login: '+name,async()=>{
  f.verifyIdToken.mockResolvedValue({...token(),auth_time:authTime()});
  expect((await createBrowserSession(request())).status).toBe(401);expect(f.createSessionCookie).not.toHaveBeenCalled();
});
for(const operation of ['verifyIdToken','createSessionCookie','verifySessionCookie','getUser'] as const) it('fails closed on '+operation+' provider denial',async()=>{
  f[operation].mockRejectedValue(new Error('Synthetic denial'));
  const r=await createBrowserSession(request());expect(r.status).toBe(401);expect(r.headers.has('set-cookie')).toBe(false);
});
it('rejects a changed account after cookie creation',async()=>{
  f.getUser.mockResolvedValueOnce(account()).mockResolvedValueOnce({...account(),disabled:true});
  const r=await createBrowserSession(request());expect(r.status).toBe(401);expect(r.headers.has('set-cookie')).toBe(false);
});
it('browser session uses the same fresh role and entitlement intersection as production Bearer authority',async()=>{
  expect(await getBrowserSession('cookie')).toEqual({uid:'owner',role:'user',entitlements:['kept']});
  f.getUser.mockResolvedValue({...account(),customClaims:{role:'admin'}});
  expect(await getBrowserSession('cookie')).toBeNull();
});
it('clears only the browser host cookie and rejects cross-origin logout',async()=>{
  const r=await clearBrowserSession(request());expect(r.status).toBe(200);
  expect(r.headers.get('set-cookie')).toBe(CONTENT_SESSION_COOKIE+'=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
  expect((await clearBrowserSession(request(undefined,{origin:'https://foreign.example'}))).status).toBe(403);
  expect(f.getUser).not.toHaveBeenCalled();
});
it('dashboard reads only the admitted owner and revalidates after the repository await',async()=>{
  const r=await getDashboardSnapshot('cookie');expect(r?.entitlements).toEqual([grant]);
  expect(f.listEntitlements).toHaveBeenCalledWith('owner');expect(f.verifySessionCookie).toHaveBeenCalledTimes(2);
});
it('dashboard refuses unsigned and revoked sessions before private reads',async()=>{
  expect(await getDashboardSnapshot(undefined)).toBeNull();expect(f.listEntitlements).not.toHaveBeenCalled();
  f.verifySessionCookie.mockRejectedValue(new Error('revoked'));
  expect(await getDashboardSnapshot('cookie')).toBeNull();expect(f.listEntitlements).not.toHaveBeenCalled();
});
it('dashboard discards fetched grants when membership changes during the read',async()=>{
  f.getUser.mockResolvedValueOnce(account()).mockResolvedValueOnce({...account(),disabled:true});
  expect(await getDashboardSnapshot('cookie')).toBeNull();
});
it('dashboard rejects foreign or excessive grants and filters actual expiry',async()=>{
  f.listEntitlements.mockResolvedValue([{...grant,userId:'foreign'}]);await expect(getDashboardSnapshot('cookie')).rejects.toThrow('Foreign entitlement');
  f.listEntitlements.mockResolvedValue(Array.from({length:101},()=>grant));await expect(getDashboardSnapshot('cookie')).rejects.toThrow('bounded read');
  f.listEntitlements.mockResolvedValue([grant,{...grant,entitlementKey:'expired',expiresAt:'2000-01-01T00:00:00.000Z'}]);
  expect((await getDashboardSnapshot('cookie'))?.entitlements).toEqual([grant]);
});

