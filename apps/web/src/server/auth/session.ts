import 'server-only';
import type { AuthRole, AuthSession } from './roles';
import { isKnownAuthRole } from './roles';
import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from '../firebase/admin';
import { contentRequestConsentPurpose, evaluateContentCanonicalConsent } from '../privacy/canonicalConsent';

const USER_ID_HEADER = 'x-urai-user-id';
const ROLE_HEADER = 'x-urai-role';

type AuthorizationClaimsLike = Record<string, unknown>;

function isHeaderAuthEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.URAI_ENABLE_HEADER_AUTH !== '0';
}

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function getRoleFromToken(decodedToken: AuthorizationClaimsLike): AuthRole | null {
  if (isKnownAuthRole(decodedToken.role)) return decodedToken.role;

  if (Array.isArray(decodedToken.roles)) {
    const role = decodedToken.roles.find(isKnownAuthRole);
    return role ?? null;
  }

  return null;
}

function getEntitlements(decodedToken: AuthorizationClaimsLike): string[] {
  return Array.isArray(decodedToken.entitlements)
    ? decodedToken.entitlements.filter((value): value is string => typeof value === 'string')
    : [];
}

function getHeaderSession(request: Request): AuthSession | null {
  if (!isHeaderAuthEnabled()) return null;

  const uid = request.headers.get(USER_ID_HEADER)?.trim();
  if (!uid) return null;

  const rawRole = request.headers.get(ROLE_HEADER)?.trim();
  const role: AuthRole | null = isKnownAuthRole(rawRole) ? rawRole : null;

  return { uid, role };
}

export async function getRequestSession(request: Request): Promise<AuthSession | null> {
  const token = getBearerToken(request);

  if (token) {
    if (!isFirebaseAdminConfigured()) return null;

    try {
      const auth = getFirebaseAdminAuth();
      const decodedToken = await auth.verifyIdToken(token, true);
      if (process.env.NODE_ENV === 'production') {
        const admitted = await getCurrentAccountSession(decodedToken, auth);
        if (!admitted) return null;
        const purpose = contentRequestConsentPurpose(request);
        if (!purpose) return admitted;
        if (!await evaluateContentCanonicalConsent(request, admitted.uid, purpose)) return null;
        // A canonical service round trip can outlive the caller's Auth grant.
        // Verify the token again and retain the same actor/role, with only the
        // currently intersected entitlements, before any private consumer runs.
        const freshToken = await auth.verifyIdToken(token, true);
        const current = await getCurrentAccountSession(freshToken, auth);
        return current?.uid === admitted.uid && current.role === admitted.role ? current : null;
      }
      return {
        uid: decodedToken.uid,
        role: getRoleFromToken(decodedToken),
        entitlements: getEntitlements(decodedToken)
      };
    } catch {
      return null;
    }
  }

  return getHeaderSession(request);
}

export async function getRequiredRequestSession(request: Request): Promise<AuthSession> {
  const session = await getRequestSession(request);
  if (!session) throw new Error('Authentication is required.');
  return session;
}

export async function getCurrentAccountSession(
  decodedToken: AuthorizationClaimsLike,
  auth: Pick<ReturnType<typeof getFirebaseAdminAuth>, 'getUser'> = getFirebaseAdminAuth()
): Promise<AuthSession | null> {
  if (typeof decodedToken.uid !== 'string' || !decodedToken.uid) return null;
  const currentAccount = await auth.getUser(decodedToken.uid);
  const currentClaims = currentAccount.customClaims;
  if (currentAccount.uid !== decodedToken.uid || currentAccount.disabled !== false
    || !currentClaims || typeof currentClaims !== 'object' || Array.isArray(currentClaims)) return null;

  const currentRole = getRoleFromToken(currentClaims);
  if (!currentRole || currentRole === 'anonymous' || currentRole !== getRoleFromToken(decodedToken)) return null;

  const verifiedEntitlements = new Set(getEntitlements(decodedToken));
  return {
    uid: currentAccount.uid,
    role: currentRole,
    entitlements: Array.from(new Set(getEntitlements(currentClaims))).filter((entitlement) => verifiedEntitlements.has(entitlement))
  };
}

