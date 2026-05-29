import 'server-only';

export type AuthFailureReason = 'unauthenticated' | 'forbidden';

export function getAuthFailureStatus(reason: AuthFailureReason): 401 | 403 {
  return reason === 'unauthenticated' ? 401 : 403;
}

export function getAuthFailureBody(reason: AuthFailureReason): { error: AuthFailureReason; message: string } {
  return reason === 'unauthenticated'
    ? { error: 'unauthenticated', message: 'Authentication is required.' }
    : { error: 'forbidden', message: 'You do not have permission to perform this action.' };
}
