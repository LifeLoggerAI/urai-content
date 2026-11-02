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
  it('refuses configuration without pinned accounts',()=>{
    expect(()=>createGoogleServiceIdentityVerifier({audience:'http://wrong',serviceAccountEmails:[]})).toThrow('pinned');
  });
});
