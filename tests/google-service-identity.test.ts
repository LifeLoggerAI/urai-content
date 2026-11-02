import { createGoogleServiceIdentityVerifier } from '../src/publishing/google-service-identity.js';
import { describe, it, expect } from 'vitest';
describe('trusted Google service OIDC guard',()=>{
  const v=createGoogleServiceIdentityVerifier({audience:'https://staging.example.test/issue',serviceAccountEmails:['issuer@urai-staging.iam.gserviceaccount.com']});
  it('rejects malformed and missing service tokens',async()=>{
    await expect(v('')).rejects.toThrow('missing');
    await expect(v('a.b.c')).rejects.toThrow();
  });
  it('rejects stale or overlong but well-formed service JWT claims before requesting keys',async()=>{
    const enc=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString('base64url');
    const jwt=(iat:number,exp:number)=>[
      enc({alg:'RS256',kid:'test-key'}),
      enc({iss:'https://accounts.google.com',aud:'https://staging.example.test/issue',
        sub:'12345678901',email:'issuer@urai-staging.iam.gserviceaccount.com',
        email_verified:true,iat,exp}),
      'ZmFrZXNpZw',
    ].join('.');
    const now=1_800_000_000;
    let calls=0;
    const guarded=createGoogleServiceIdentityVerifier({
      audience:'https://staging.example.test/issue',
      serviceAccountEmails:['issuer@urai-staging.iam.gserviceaccount.com'],
      clock:()=>now*1000,
      fetchImpl:async()=>{calls+=1;throw Error('unexpected key fetch');},
    });
    await expect(guarded(jwt(now-7200,now+600))).rejects.toThrow('untrusted');
    await expect(guarded(jwt(now-120,now+7200))).rejects.toThrow('untrusted');
    await expect(guarded(jwt(now+61,now+3600))).rejects.toThrow('untrusted');
    await expect(guarded(jwt(now,now))).rejects.toThrow('untrusted');
    expect(calls).toBe(0);
  });
  it('verifies a real RSA-2048 signature from a pinned mock Google key', async () => {
    const { generateKeyPairSync, sign } = await import('node:crypto');
    const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'verified-test-key', alg: 'RS256', use: 'sig' };
    const epoch = 1_800_000_000;
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const claims = {
      iss: 'https://accounts.google.com', aud: 'https://staging.example.test/issue',
      sub: '12345678901', email: 'issuer@urai-staging.iam.gserviceaccount.com',
      email_verified: true, iat: epoch - 120, exp: epoch + 2400,
    };
    const makeToken = (body: Record<string, unknown>, signingKey = privateKey) => {
      const input = encode({ alg: 'RS256', kid: 'verified-test-key', typ: 'JWT' }) + '.' + encode(body);
      return input + '.' + sign('RSA-SHA256', Buffer.from(input), signingKey).toString('base64url');
    };
    let certificateRequests = 0;
    const verifier = createGoogleServiceIdentityVerifier({
      audience: 'https://staging.example.test/issue',
      serviceAccountEmails: ['issuer@urai-staging.iam.gserviceaccount.com'],
      clock: () => epoch * 1000,
      fetchImpl: async (url, init) => {
        certificateRequests += 1;
        expect(url).toBe('https://www.googleapis.com/oauth2/v3/certs');
        expect(init?.signal).toBeDefined();
        expect(init?.redirect).toBe('error');
        expect(init?.cache).toBe('no-store');
        return { ok: true, json: async () => ({ keys: [jwk] }) };
      },
    });
    await expect(verifier(makeToken(claims))).resolves.toEqual({
      serviceId: claims.sub, email: claims.email,
    });
    // These negative paths carry genuine RSA signatures, rather than malformed
    // token text that never reaches cryptographic verification.
    for (const mutated of [
      { ...claims, aud: 'https://wrong.example.test/issue' },
      { ...claims, email: 'other@urai-staging.iam.gserviceaccount.com' },
      { ...claims, email_verified: false },
      { ...claims, iss: 'https://wrong-issuer.example.test' },
      { ...claims, iat: epoch - 7200 },
      { ...claims, iat: epoch + 61 },
      { ...claims, exp: epoch - 1 },
      { ...claims, exp: epoch + 7200 },
      { ...claims, nbf: epoch + 61 },
      { ...claims, exp: claims.iat },
    ]) {
      await expect(verifier(makeToken(mutated))).rejects.toThrow();
    }
    const untrusted = generateKeyPairSync('rsa', { modulusLength: 2048 });
    await expect(verifier(makeToken(claims, untrusted.privateKey))).rejects.toThrow('signature');
    expect(certificateRequests).toBe(2);
  });
  it('rejects redirected and off-origin Google certificate responses', async () => {
    const { generateKeyPairSync, sign } = await import('node:crypto');
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'redirect-check', alg: 'RS256', use: 'sig' };
    const epoch = 1_800_000_000;
    const encode = (x: unknown) => Buffer.from(JSON.stringify(x)).toString('base64url');
    const input = encode({ alg: 'RS256', kid: 'redirect-check' }) + '.' + encode({
      iss: 'https://accounts.google.com', aud: 'https://staging.example.test/issue',
      sub: '12345678901', email: 'issuer@urai-staging.iam.gserviceaccount.com',
      email_verified: true, iat: epoch - 120, exp: epoch + 2400,
    });
    const token = input + '.' + sign('RSA-SHA256', Buffer.from(input), privateKey).toString('base64url');
    const mk = (redirected: boolean, url: string) => createGoogleServiceIdentityVerifier({
      audience: 'https://staging.example.test/issue',
      serviceAccountEmails: ['issuer@urai-staging.iam.gserviceaccount.com'],
      clock: () => epoch * 1000,
      fetchImpl: async (requested, init) => {
        expect(requested).toBe('https://www.googleapis.com/oauth2/v3/certs');
        expect(init?.redirect).toBe('error');
        expect(init?.cache).toBe('no-store');
        return { ok: true, redirected, url, json: async () => ({ keys: [jwk] }) };
      },
    });
    await expect(mk(true, 'https://attacker.example.test/certs')(token)).rejects.toThrow('certificates');
    await expect(mk(false, 'https://attacker.example.test/certs')(token)).rejects.toThrow('certificates');
    await expect(mk(false, 'https://www.googleapis.com/oauth2/v3/certs')(token)).resolves.toEqual({
      serviceId: '12345678901', email: 'issuer@urai-staging.iam.gserviceaccount.com',
    });
  });
  it('refuses configuration without pinned accounts',()=>{
    expect(()=>createGoogleServiceIdentityVerifier({audience:'http://wrong',serviceAccountEmails:[]})).toThrow('pinned');
  });
});
