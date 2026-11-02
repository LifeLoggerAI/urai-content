/** URAI release-v2 deterministic serialization: sorted ASCII keys, strict JSON values.
 * Both repositories must use identical rules and domain separation.
 * Deliberately excludes non-JSON values, floats, -0, and undefined.
 */
export const RELEASE_V2_SCHEMA = 'urai-content-marketing-release-v2';
export const RELEASE_V2_DOMAIN = 'URAI_CONTENT_MARKETING_RELEASE_V2\n';
export function canonicalReleaseV2(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isSafeInteger(value) && !Object.is(value, -0)) return String(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalReleaseV2).join(',') + ']';
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const source = value as Record<string, unknown>;
    const keys = Object.keys(source).sort();
    if (keys.some(k => k === '__proto__' || k === 'constructor' || k === 'prototype')) throw Error('unsafe key');
    return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalReleaseV2(source[k])).join(',') + '}';
  }
  throw Error('noncanonical release value');
}
