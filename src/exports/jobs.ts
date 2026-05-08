import type { ExportJob } from '../schemas/production.js';

export function startExportJob(job: ExportJob, now = new Date().toISOString()): ExportJob {
  if (job.status !== 'queued') {
    throw new Error(`Cannot start export job ${job.id} from status ${job.status}`);
  }

  return {
    ...job,
    status: 'processing',
    updatedAt: now,
    errorMessage: null
  };
}

export function completeExportJob(
  job: ExportJob,
  outputUrls: string[],
  checksum: string,
  now = new Date().toISOString()
): ExportJob {
  if (job.status !== 'processing' && job.status !== 'queued') {
    throw new Error(`Cannot complete export job ${job.id} from status ${job.status}`);
  }

  if (outputUrls.length === 0) {
    throw new Error(`Cannot complete export job ${job.id} without output URLs`);
  }

  if (!checksum) {
    throw new Error(`Cannot complete export job ${job.id} without checksum`);
  }

  return {
    ...job,
    status: 'complete',
    updatedAt: now,
    completedAt: now,
    outputUrls,
    checksum,
    errorMessage: null
  };
}

export function failExportJob(job: ExportJob, errorMessage: string, now = new Date().toISOString()): ExportJob {
  if (!errorMessage.trim()) {
    throw new Error(`Cannot fail export job ${job.id} without an error message`);
  }

  return {
    ...job,
    status: 'failed',
    retryCount: job.retryCount + 1,
    updatedAt: now,
    completedAt: null,
    errorMessage
  };
}

export function canRetryExportJob(job: ExportJob, maxRetries = 3): boolean {
  return job.status === 'failed' && job.retryCount < maxRetries;
}

export function retryExportJob(job: ExportJob, now = new Date().toISOString()): ExportJob {
  if (!canRetryExportJob(job)) {
    throw new Error(`Cannot retry export job ${job.id}`);
  }

  return {
    ...job,
    status: 'queued',
    updatedAt: now,
    completedAt: null,
    errorMessage: null
  };
}
