import 'server-only';
import { hasFirebaseAdminCredentials } from '@/server/firebase/adminEnv';

export type AuthRuntimeStatus = {
  authConfigured: boolean;
  mode: 'firebase-admin-ready' | 'not-configured';
  message: string;
};

export function getAuthRuntimeStatus(): AuthRuntimeStatus {
  const authConfigured = hasFirebaseAdminCredentials();

  if (!authConfigured) {
    return {
      authConfigured: false,
      mode: 'not-configured',
      message: 'Firebase Admin credentials are not configured, so protected routes render setup placeholders instead of authenticated user data.'
    };
  }

  return {
    authConfigured: true,
    mode: 'firebase-admin-ready',
    message: 'Firebase Admin is configured. Session verification and role claims still need to be wired before protected routes expose real user data.'
  };
}
