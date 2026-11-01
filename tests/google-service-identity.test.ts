import { createGoogleServiceIdentityVerifier } from '../src/publishing/google-service-identity.js';
import { describe, it, expect } from 'vitest';
describe('trusted Google service OIDC guard',()=>{
  const v=createGoogleServiceIdentityVerifier({audience:'https://staging.example.test/issue',serviceAccountEmails:['issuer@urai-staging.iam.gserviceaccount.com']});
  it('rejects malformed and missing service tokens',async()=>{
    await expect(v('')).rejects.toThrow('missing');
    await expect(v('a.b.c')).rejects.toThrow();
  });
  it('refuses configuration without pinned accounts',()=>{
    expect(()=>createGoogleServiceIdentityVerifier({audience:'http://wrong',serviceAccountEmails:[]})).toThrow('pinned');
  });
});
