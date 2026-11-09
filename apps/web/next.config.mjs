/** @type {import('next').NextConfig} */
// A prebuilt Vercel deployment does not guarantee Vercel/GitHub runtime
// environment variables. Embed one validated public commit ID in the compiled
// artifact instead of trusting a runtime environment fallback as source proof.
const COMMIT_SHA = /^[a-f0-9]{40}$/;
const suppliedCommitShas = [
  process.env.URAI_CONTENT_RELEASE_SHA,
  process.env.URAI_CONTENT_BUILD_SHA,
  process.env.GITHUB_SHA,
  process.env.VERCEL_GIT_COMMIT_SHA,
].filter((value) => value !== undefined && value !== '');
if (suppliedCommitShas.some((value) => !COMMIT_SHA.test(value))) {
  throw new Error('URAI_CONTENT_BUILD_COMMIT_INVALID');
}
if (new Set(suppliedCommitShas).size > 1) {
  throw new Error('URAI_CONTENT_BUILD_COMMIT_CONFLICT');
}
const compiledCommitSha = suppliedCommitShas[0] ?? '';

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Next.js substitutes this constant at build time, including for the
  // dynamic /api/version route. It is not a credential or private identifier.
  env: { URAI_CONTENT_COMPILED_SHA: compiledCommitSha, URAI_CONTENT_BUILD_SHA: compiledCommitSha },
  webpack(config) {
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs']
    };
    return config;
  }
};

export default nextConfig;
