export type { AuthRole, AuthSession, AuthorizationResult } from './roles';

export { AUTH_ROLES, isKnownAuthRole } from './roles';

export {
  canCreateCreatorSubmission,
  canCreateOwnedResource,
  canReadOwnedResource,
  hasPermission,
  isAdminSession,
  isCreatorSession,
  isSignedIn,
  requireAdmin,
  requirePermissionResult
} from './rbac';