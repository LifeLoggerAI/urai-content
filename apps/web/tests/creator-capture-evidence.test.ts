import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { captureCreatorSignedOutEvidence } from '../e2e/creator-capture-evidence';

const exactHead = '12baf0ce9bf6fe5b7cf3c10b33648b6d2e9acba5';
let output: string;
let scrollY: number;
let active: { tagName: string };
const skipLink = {
  tagName: 'A',
  getBoundingClientRect: () => ({ x: 16, y: -64, width: 170, height: 44, top: -64, right: 186, bottom: -20, left: 16 }),
  matches: (selector: string) => selector === ':focus' && active === skipLink,
  // These private/unbounded fields must never be read into evidence.
  get href(): string { throw new Error('URL must not be read'); },
  get textContent(): string { throw new Error('Text must not be read'); },
};
const fullPageBytes = Buffer.from('explicit-synthetic-full-page-image-port');
const viewportBytes = Buffer.from('explicit-synthetic-viewport-image-port');

beforeEach(async () => {
  output = await fs.mkdtemp(path.join(os.tmpdir(), 'content-capture-evidence-'));
  scrollY = 460; active = { tagName: 'BUTTON' };
  vi.stubGlobal('window', {
    get scrollX() { return 0; }, get scrollY() { return scrollY; },
    innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    visualViewport: { width: 1280, height: 720, offsetLeft: 0, offsetTop: 0, pageLeft: 0, pageTop: 460, scale: 1 },
  });
  vi.stubGlobal('document', {
    querySelector: () => skipLink,
    documentElement: { scrollWidth: 1280, scrollHeight: 2000 },
    get activeElement() { return active; },
  });
});
afterEach(async () => { vi.unstubAllGlobals(); await fs.rm(output, { recursive: true, force: true }); });

function pagePort() {
  const screenshot = vi.fn(async (options: { path: string; fullPage: boolean }) => {
    const bytes = options.fullPage ? fullPageBytes : viewportBytes;
    await fs.writeFile(options.path, bytes);
    return bytes;
  });
  const evaluate = vi.fn(async (read: () => unknown) => read());
  return { page: { screenshot, evaluate } as unknown as Page, screenshot, evaluate };
}

describe('creator capture custody through explicit synthetic DOM/image ports, not browser pixels', () => {
  it('preserves the full-page image and retains a separately hashed viewport/state pair without changing focus or scroll', async () => {
    const { page, screenshot } = pagePort();
    const receipt = await captureCreatorSignedOutEvidence(page, 'chromium-desktop', output, exactHead);
    expect(screenshot.mock.calls.map(([o]) => [path.basename(o.path), o.fullPage])).toEqual([
      ['chromium-desktop-creator-signed-out.png', true],
      ['chromium-desktop-creator-signed-out-viewport.png', false],
    ]);
    expect(receipt.exactHead).toBe(exactHead);
    expect(receipt.beforeFullPage.scroll.y).toBe(460);
    expect(receipt.afterFullPage.scroll.y).toBe(460);
    expect(receipt.afterViewport.scroll.y).toBe(460);
    expect(receipt.beforeFullPage.activeElement).toEqual({ tagName: 'button', isSkipLink: false });
    expect(receipt.beforeFullPage.skipLink.viewportIntersection).toEqual({ width: 170, height: 0 });
    expect(receipt.images[0].sha256).toBe(createHash('sha256').update(fullPageBytes).digest('hex'));
    expect(receipt.images[1].sha256).toBe(createHash('sha256').update(viewportBytes).digest('hex'));
    expect(JSON.parse(await fs.readFile(path.join(output, 'chromium-desktop-creator-capture-state.json'), 'utf8'))).toEqual(receipt);
    expect(receipt.normalizationPerformed).toBe(false);
    expect(receipt.visualAcceptance).toBe(false);
  });

  it('records a capture-induced state change instead of silently normalizing it', async () => {
    const { page, screenshot } = pagePort();
    screenshot.mockImplementationOnce(async (options) => {
      await fs.writeFile(options.path, fullPageBytes);
      scrollY = 0; active = skipLink;
      return fullPageBytes;
    });
    const receipt = await captureCreatorSignedOutEvidence(page, 'chromium-mobile', output, exactHead);
    expect(receipt.beforeFullPage.scroll.y).toBe(460);
    expect(receipt.afterFullPage.scroll.y).toBe(0);
    expect(receipt.afterFullPage.activeElement).toEqual({ tagName: 'a', isSkipLink: true });
    expect(receipt.afterFullPage.skipLink.focused).toBe(true);
    expect(receipt.normalizationPerformed).toBe(false);
  });

  it('does not retain private values, URL, tokens, text or identity in the fixed state allowlist', async () => {
    active = { tagName: 'INPUT', value: 'synthetic-private-value', textContent: 'synthetic-private-text', id: 'synthetic-private-identity', token: 'synthetic-private-token' } as typeof active;
    const { page } = pagePort();
    const receipt = await captureCreatorSignedOutEvidence(page, 'chromium-tablet', output, exactHead);
    const encoded = JSON.stringify(receipt);
    expect(encoded).not.toContain('synthetic-private-');
    expect(receipt.beforeFullPage.activeElement).toEqual({ tagName: 'input', isSkipLink: false });
    expect(receipt.privateInputValuesRetained).toBe(false);
    expect(receipt.accessibilityBehaviorChanged).toBe(false);
  });

  it('rejects a failed original screenshot and never writes a complete paired receipt', async () => {
    const { page, screenshot } = pagePort();
    screenshot.mockRejectedValueOnce(new Error('original capture failed'));
    await expect(captureCreatorSignedOutEvidence(page, 'chromium-desktop', output, exactHead)).rejects.toThrow('original capture failed');
    expect(screenshot).toHaveBeenCalledTimes(1);
    expect(await fs.readdir(output)).toEqual([]);
  });

  it('rejects a failed viewport capture while preserving the original image without fabricating paired success', async () => {
    const { page, screenshot } = pagePort();
    screenshot.mockImplementationOnce(async (options) => { await fs.writeFile(options.path, fullPageBytes); return fullPageBytes; });
    screenshot.mockRejectedValueOnce(new Error('viewport capture failed'));
    await expect(captureCreatorSignedOutEvidence(page, 'chromium-desktop', output, exactHead)).rejects.toThrow('viewport capture failed');
    expect(await fs.readFile(path.join(output, 'chromium-desktop-creator-signed-out.png'))).toEqual(fullPageBytes);
    expect(await fs.readdir(output)).toEqual(['chromium-desktop-creator-signed-out.png']);
  });

  it('rejects unavailable DOM measurement rather than certifying an unobserved state', async () => {
    const { page, screenshot, evaluate } = pagePort();
    evaluate.mockRejectedValueOnce(new Error('DOM observation unavailable'));
    await expect(captureCreatorSignedOutEvidence(page, 'chromium-desktop', output, exactHead)).rejects.toThrow('DOM observation unavailable');
    expect(screenshot).not.toHaveBeenCalled();
    expect(await fs.readdir(output)).toEqual([]);
  });
});
