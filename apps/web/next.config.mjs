const sourceIdentities = [
  process.env.URAI_CONTENT_BUILD_SHA,
  process.env.VERCEL_GIT_COMMIT_SHA,
  process.env.GITHUB_SHA
].filter((value) => value !== undefined && value !== '');

if (sourceIdentities.some((value) => !/^[0-9a-f]{40}$/.test(value))) {
  throw new Error('Content build identity must be a complete lowercase Git SHA.');
}
if (new Set(sourceIdentities).size > 1) {
  throw new Error('Content build source identities disagree.');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  env: { URAI_CONTENT_BUILD_SHA: sourceIdentities[0] ?? '' },
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
