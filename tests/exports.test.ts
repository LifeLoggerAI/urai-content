import { describe, expect, it } from 'vitest';
import { exportJobs } from '../src/seed/productionData.js';
import { completeExportJob, failExportJob, retryExportJob, startExportJob } from '../src/exports/jobs.js';
import { formatSrtTimestamp, generateSrt, sanitizeSrtText } from '../src/exports/srt.js';

describe('SRT export utilities', () => {
  it('formats SRT timestamps', () => {
    expect(formatSrtTimestamp(0)).toBe('00:00:00,000');
    expect(formatSrtTimestamp(3723004)).toBe('01:02:03,004');
  });

  it('sanitizes and generates SRT content', () => {
    expect(sanitizeSrtText('  First line\r\n\r\nSecond line  ')).toBe('First line\nSecond line');

    const srt = generateSrt([
      { startMs: 0, endMs: 1500, text: 'The sky remembers.' },
      { startMs: 1500, endMs: 3200, text: 'Your pattern softened today.' }
    ]);

    expect(srt).toContain('1\n00:00:00,000 --> 00:00:01,500');
    expect(srt).toContain('2\n00:00:01,500 --> 00:00:03,200');
    expect(srt.endsWith('\n')).toBe(true);
  });

  it('rejects invalid cues', () => {
    expect(() => generateSrt([{ startMs: 100, endMs: 100, text: 'bad' }])).toThrow('endMs must be greater');
    expect(() => generateSrt([{ startMs: 0, endMs: 100, text: '   ' }])).toThrow('text is empty');
  });
});

describe('export job lifecycle utilities', () => {
  it('starts and completes a queued export job', () => {
    const queued = exportJobs.find((job) => job.id === 'export-demo-srt');
    expect(queued).toBeDefined();

    const processing = startExportJob(queued!);
    expect(processing.status).toBe('processing');

    const complete = completeExportJob(processing, ['https://www.uraicontent.com/demo/exports/story.srt'], 'sha256-story');
    expect(complete.status).toBe('complete');
    expect(complete.completedAt).toBeTruthy();
    expect(complete.outputUrls).toHaveLength(1);
  });

  it('fails and retries eligible export jobs', () => {
    const queued = exportJobs.find((job) => job.id === 'export-demo-srt');
    const failed = failExportJob(queued!, 'Temporary renderer unavailable');
    expect(failed.status).toBe('failed');
    expect(failed.retryCount).toBe(queued!.retryCount + 1);

    const retried = retryExportJob(failed);
    expect(retried.status).toBe('queued');
    expect(retried.errorMessage).toBeNull();
  });

  it('prevents invalid completion and retry states', () => {
    const complete = exportJobs.find((job) => job.id === 'export-demo-ritual-card');
    const failed = exportJobs.find((job) => job.id === 'export-demo-license-evidence');

    expect(() => completeExportJob(complete!, [], 'sha256-empty')).toThrow('from status complete');
    expect(() => retryExportJob({ ...failed!, retryCount: 3 })).toThrow('Cannot retry export job');
  });
});
