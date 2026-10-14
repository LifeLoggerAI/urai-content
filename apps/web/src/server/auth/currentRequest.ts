import 'server-only';
import type { AuthSession } from './roles';
import { getRequestSession } from './session';

// Async input and repository work can outlive admission. Re-use the canonical
// request verifier and bind the fresh result to the same admitted actor.
export async function recheckRequestSession(request: Request, admitted: AuthSession): Promise<AuthSession | null> {
  const current = await getRequestSession(request);
  return current?.uid === admitted.uid ? current : null;
}
