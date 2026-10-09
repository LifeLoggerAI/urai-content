import { randomUUID } from 'node:crypto';
import { FieldPath } from 'firebase-admin/firestore';
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '@/server/firebase/admin';
import { getRequestSession } from '@/server/auth/session';
import { hasPermission } from '@/server/auth/rbac';
import { collectContentSubjectExport, createContentExportOperation, ContentExportError } from '@/server/privacy/contentExport';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
const headers = { 'content-type': 'application/json', 'cache-control': 'private, no-store', pragma: 'no-cache',
  'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' };
function error(status: number, code: string) {
  const recovery = code === 'export_limit' ? {
    message: 'This Content export exceeds its safe size or time limit. No partial file was returned.',
    action: 'Contact the privacy request operator for a governed larger export. Do not assume the unmapped scopes are included.',
    automaticRetry: false
  } : undefined;
  return new Response(JSON.stringify({ ok: false, error: code, complete: false, recovery }), { status, headers });
}

export async function GET(request: Request): Promise<Response> {
  if (new URL(request.url).search || request.body) return error(400, 'invalid_request');
  if (request.signal.aborted) return error(499, 'export_cancelled');
  const operation = createContentExportOperation(request.signal);
  const boundedRequest = new Request(request, { signal: operation.signal });
  try {
    const admitted = await operation.wait(() => getRequestSession(boundedRequest));
    if (!admitted) return error(401, 'current_export_authority_required');
    if (!hasPermission(admitted, 'exports:readOwn')) return error(403, 'forbidden');
    if (!isFirebaseAdminConfigured()) return error(503, 'export_unavailable');
    const db = getFirebaseAdminDb();
    const requireCurrent = async () => {
      if (request.signal.aborted) throw new ContentExportError('export_cancelled');
      const current = await getRequestSession(boundedRequest);
      if (!current || current.uid !== admitted.uid || current.role !== admitted.role || !hasPermission(current, 'exports:readOwn'))
        throw new Error('current_export_authority_required');
      if (request.signal.aborted) throw new ContentExportError('export_cancelled');
    };
    const result = await collectContentSubjectExport({
      uid: admitted.uid, requestId: randomUUID(), signal: request.signal, requireCurrent, operation,
      store: { async readPage(page) {
        let query = db.collection(page.collection).where(page.field, '==', page.value).orderBy(FieldPath.documentId());
        if (page.afterId) query = query.startAfter(page.afterId);
        const snapshot = await query.limit(page.limit).get();
        return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
      } }
    });
    return new Response(result.body, { status: 200, headers: { ...headers,
      'content-disposition': 'attachment; filename="urai-content-records.json"', 'x-urai-export-scope': 'partial-content-records' } });
  } catch (failure) {
    if (failure instanceof ContentExportError) return error(
      failure.code === 'export_cancelled' ? 499 : failure.code === 'export_limit' ? 413 : 503, failure.code);
    if (failure instanceof Error && failure.message === 'current_export_authority_required') return error(401, 'current_export_authority_required');
    return error(503, 'export_unavailable');
  } finally { operation.dispose(); }
}
