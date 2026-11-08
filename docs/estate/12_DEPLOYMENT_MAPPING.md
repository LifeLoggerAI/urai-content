# Verified deployment/source/project mapping
## Actual Vercel provider
Project `urai-content`, ID `prj_tcHThuSZ0Zpm4fXp5jHif2EbOdpv`, Next.js, Node 24.x; `live:false`. Three recorded production-target deployments `dpl_67Tk8VHyiixvntsphVXEmo3YQ6jK`, `dpl_4yJHUbScG8NbgupDK2cuPAXsd96q` and `dpl_7Zw5D4kaB7f4bNg4oFd6YGzVJ8PJ` returned **ERROR**. Latest deployment [provider dashboard](https://vercel.com/adam-clamps-projects/urai-content/7Zw5D4kaB7f4bNg4oFd6YGzVJ8PJ) has build `ENOENT`, doubled `/vercel/path0/vercel/path0/.next/routes-manifest.json`. It compiled a Next source artifact before packaging failed; compiled status alone does not imply live release, nor prove Git SHA identity.

## Firebase configuration discrepancy
Root `firebase.json` selects `public/` Hosting SPA and root `firestore.rules`, `storage.rules`. `apps/web/firebase.json` selects a Next Firebase-framework backend, site `www-uraicontent`, `us-central1`, separate `apps/web/firestore.rules`, `apps/web/storage.rules`. This **does not** identify an actual deployed Content Firebase project, nor prove any rules installed. `apps/web/src/server/firebase/adminEnv.ts` requires WIF external_account ADC and rejects long-lived service credentials, but runtime IAM/project/bucket/read access was not verified. Do not infer project ownership from `www-uraicontent`.

## Hostnames and endpoints
`uraicontent.com` and `www.uraicontent.com` are planned launch smoke hosts in `docs/EXTERNAL_ENV_DEPLOYMENT_HANDOFF.md`. Their DNS/TLS, active source, response, auth and rollbacks were not confirmed. Code routes: `/api/catalog`, `/api/content`, `/api/creator/submissions`, `/api/admin/creator-submissions`, `/api/leads`, `/api/analytics`, `/api/health`, `/api/version`; `/api/privacy/export` only exists on unmerged #96.

## Release target proof required
Declared project, effective deployed Firestore+Storage Rules SHA, roles/IAM and owner/nonowner negative requests, current Privacy decisions, payment/media/external provider isolation, exact source compiled+host SHA parity, browser route/end-user QA, DNS/SSL, monitoring/alerts, rollback and release authority. [Blocker issue #61](https://github.com/LifeLoggerAI/urai-content/issues/61) remains open. No deployment or billing change was made.
