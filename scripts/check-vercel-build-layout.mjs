import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// This preflight does not contact Vercel, read environment files, or change settings.
// It validates the pulled project's layout against the existing apps/web runtime.
export function inspectVercelBuildLayout({ repositoryRoot, invocationDirectory, project, expectedProjectId, expectedOrgId, pathApi = path }) {
  const failures = [];
  const fail = (code) => failures.push(code);
  const settings = project?.settings;
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return { ok: false, failures: ['PROJECT_SETTINGS_MISSING'] };
  }
  if (!expectedProjectId || !expectedOrgId) fail('EXPECTED_PROJECT_IDENTITY_MISSING');
  if (project.projectId !== expectedProjectId || project.orgId !== expectedOrgId) fail('PROJECT_IDENTITY_MISMATCH');
  const expectedWeb = pathApi.resolve(repositoryRoot, 'apps', 'web');
  const root = settings.rootDirectory === '' || settings.rootDirectory === null || settings.rootDirectory === undefined
    ? '.' : settings.rootDirectory;
  const relativePath = (value) => typeof value === 'string' && value.length > 0 &&
    !path.posix.isAbsolute(value) && !path.win32.isAbsolute(value) &&
    !value.includes('\\') && !value.split('/').includes('..');
  if (!relativePath(root)) fail('ROOT_DIRECTORY_INVALID');
  let actualWeb;
  if (relativePath(root)) {
    // Vercel CLI 59.23.1's build implementation resolves workPath with this join.
    // This repository has no workspace declarations or repository-level Vercel link.
    actualWeb = pathApi.resolve(pathApi.join(invocationDirectory, root));
    if (actualWeb !== expectedWeb) fail('WEB_ROOT_MISMATCH');
  }
  // Null may enable Vercel autodetection; it is unverified here, not known invalid.
  if (settings.framework !== 'nextjs') fail('NEXT_FRAMEWORK_UNVERIFIED');
  const output = settings.outputDirectory;
  if (output !== null && output !== undefined) {
    if (!relativePath(output)) fail('OUTPUT_DIRECTORY_INVALID');
    else if (actualWeb && pathApi.resolve(actualWeb, output) !== pathApi.join(expectedWeb, '.next')) fail('NEXT_OUTPUT_MISMATCH');
  }
  const knownCommands = {
    buildCommand: new Set(['npm run build', 'next build']),
    installCommand: new Set(['npm ci', 'npx --yes npm@11.19.1 ci'])
  };
  for (const key of ['buildCommand', 'installCommand']) {
    const command = settings[key];
    if (command !== null && command !== undefined && typeof command !== 'string') fail('COMMAND_TYPE_INVALID');
    // The app package already owns build/install; repository-relative wrappers
    // from this directory would target a second apps/web directory.
    if (typeof command === 'string' && /(?:--prefix(?:=|\s+)['"]?apps\/web\b|\bcd\s+['"]?apps\/web\b|\bnpm\s+run\s+web:(?:build|install)\b)/.test(command)) fail('NESTED_WEB_COMMAND');
    else if (typeof command === 'string' && !knownCommands[key].has(command.trim())) fail('CUSTOM_COMMAND_REQUIRES_REVIEW');
  }
  return { ok: failures.length === 0, failures: [...new Set(failures)] };
}

export async function checkPulledProject({ repositoryRoot, invocationDirectory, projectFile, expectedProjectId, expectedOrgId }) {
  const [repo, invocation, projectLocation] = await Promise.all([
    realpath(repositoryRoot), realpath(invocationDirectory), realpath(projectFile)
  ]);
  const expectedLocation = path.join(invocation, '.vercel', 'project.json');
  if (projectLocation !== expectedLocation) return { ok: false, failures: ['PULLED_PROJECT_LOCATION_MISMATCH'] };
  const project = JSON.parse(await readFile(projectLocation, 'utf8'));
  // Refuse to infer newer linkage/override semantics from an uninspected source.
  for (const entry of ['pnpm-workspace.yaml', '.vercel/repo.json', 'vercel.json', 'vercel.ts', 'apps/web/vercel.json', 'apps/web/vercel.ts']) {
    try { await realpath(path.join(repo, entry)); return { ok: false, failures: ['LAYOUT_OVERRIDE_REQUIRES_REVIEW'] }; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const packageJson = JSON.parse(await readFile(path.join(repo, 'package.json'), 'utf8'));
  if (packageJson.workspaces !== undefined) return { ok: false, failures: ['WORKSPACE_LINKAGE_REQUIRES_REVIEW'] };
  return inspectVercelBuildLayout({ repositoryRoot: repo, invocationDirectory: invocation, project, expectedProjectId, expectedOrgId });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await checkPulledProject({
      repositoryRoot: fileURLToPath(new URL('..', import.meta.url)),
      invocationDirectory: process.cwd(),
      projectFile: path.join(process.cwd(), '.vercel', 'project.json'),
      expectedProjectId: process.env.VERCEL_PROJECT_ID,
      expectedOrgId: process.env.VERCEL_ORG_ID
    });
    console.log(JSON.stringify({ check: 'vercel-build-layout', ...result, deploymentVerified: false }));
    if (!result.ok) process.exitCode = 1;
  } catch {
    // Project/configuration parsing must never echo provider values or secrets.
    console.error(JSON.stringify({ check: 'vercel-build-layout', ok: false, failures: ['PROJECT_READ_FAILED'], deploymentVerified: false }));
    process.exitCode = 1;
  }
}
