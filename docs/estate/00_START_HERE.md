# One UrAi Genesis — Content forensic review continuity

**HOLD. Documentation and Git object evidence only; production not certified.**

This independent successor extends Content Genesis starter PR #113 (source 3edd6239328fc2c09130c7660cc825d04bcb582c). It does not overwrite controller PR #96 or publisher PRs #110/#111/#112, and does not deploy or call billable providers.

Main exact source: 988ca4f7f38b1ce86e4d3f426361b5866fd23e0d; 388 blob paths, 117 trees, 1514321 Git-reported bytes; truncated=false.
Review heads: pr96_content_convergence (6321c38a939d26557a1c12cce3126ff6fd97dd6c, 487 blobs); pr110_publication (34d41bf3de267e2fed488f82c6dd24ecd21ad663, 390 blobs); pr111_issuer (18fe4de11568e632cfc902e2a2cab526fd3554d3, 394 blobs); pr112_vercel_guard (295e4ab4d1b2c886a2c0801306d071e280288891, 404 blobs); pr113_genesis_starter (3edd6239328fc2c09130c7660cc825d04bcb582c, 389 blobs).
The main manifest inventories **every tracked main-tree file** by path, Git blob object SHA-1, mode and Git-reported size. The review manifest records every added, modified or missing path against main for five unmerged review tree heads. Git object SHAs are not independently computed raw byte SHA256.

Root/app Firestore and Storage rules differ. The main session path has configurable header auth and does not call the #96 canonical Privacy C1/C7 consumer. A proposed stronger issuer exists only in #111, a separate stack. See forthcoming detailed analysis documents in this review branch.

Vercel urai-content project prj_tcHThuSZ0Zpm4fXp5jHif2EbOdpv reports live=false and all three returned production-target deployments ERROR; latest dpl_7Zw5D4kaB7f4bNg4oFd6YGzVJ8PJ fails on doubled /vercel/path0/vercel/path0/.next/routes-manifest.json. This is an authentic read-only provider finding, not a claimed fix.

No native build or test was executed in this audit. Historical green CI pertains to a different SHA; recent GH checks failed with jobs executing zero steps. Existing production readiness issue #61 is open.

Do not copy content from the private central registry in urai-labs-llc PR #262 to this public repository. No raw personal information, credentials or private memories were inspected or recorded.
