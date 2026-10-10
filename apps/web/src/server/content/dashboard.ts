import 'server-only';
import { getBrowserSession } from '../auth/browserSession';
import { hasPermission } from '../auth/rbac';
import { createRuntimeContentRepository } from './service';
import { userContentEntitlementSchema } from './schemas';

export async function getDashboardSnapshot(cookie: string | undefined) {
  const admitted = await getBrowserSession(cookie);
  if (!admitted || !hasPermission(admitted, 'entitlements:readOwn')) return null;
  const rows = await createRuntimeContentRepository().listEntitlements(admitted.uid);
  if (rows.length > 100) throw new Error('Entitlements exceed bounded read');
  const parsed = rows.map(row => userContentEntitlementSchema.parse(row));
  if (parsed.some(row => row.userId !== admitted.uid)) throw new Error('Foreign entitlement identity');
  const current = await getBrowserSession(cookie);
  if (!current || current.uid !== admitted.uid || current.role !== admitted.role || !hasPermission(current, 'entitlements:readOwn')) return null;
  return {
    session: current,
    entitlements: parsed.filter(row => row.expiresAt === null || Date.parse(row.expiresAt) > Date.now())
  };
}

