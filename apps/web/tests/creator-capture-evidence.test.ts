import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { captureCreatorSignedOutEvidence } from '../e2e/creator-capture-evidence';

// Explicit synthetic receipt identity; native CI supplies its actual exact head.
const exactHead = 'dea8770611094c8237d1b8b9f8ab8861e77ef775';
let output: string;
let scrollY: number;
let active: { tagName: string };
const skipLink = {
  tagName: 'A',
  getBoundingClientRect: () => {
    const top = active === skipLink ? 16 : -64;
    return { x: 16, y: top, width: 170, height: 44, top, right: 186, bottom: top + 44, left: 16 };
  },
  matches: (selector: string) => [':focus', ':focus-visible'].includes(selector) && active === skipLink,
  // These private/unbounded fields must never be read into evidence.
  get href(): string { throw new Error('URL must not be read'); },
  get textContent(): string { throw new Error('Text must not be read'); },
};
const fullPageBytes = Buffer.from('explicit-synthetic-full-page-image-port');
const viewportBytes = Buffer.from('explicit-synthetic-viewport-image-port');
const topOfDocumentBytes = Buffer.from('explicit-synthetic-top-of-document-image-port');

beforeEach(async () => {
  output = await fs.mkdtemp(path.join(os.tmpdir(), 'content-capture-evidence-'));
  scrollY = 460; active = { tagName: 'BUTTON' };
  vi.stubGlobal('window', {
    get scrollX() { return 0; }, get scrollY() { return scrollY; },
    scrollTo: vi.fn(({ top }: { left: number; top: number; behavior: string }) => { scrollY = top; }),
    innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    visualViewport: { width: 1280, height: 720, offsetLeft: 0, offsetTop: 0, pageLeft: 0, get pageTop() { return scrollY; }, scale: 1 },
  });
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 0; });
  vi.stubGlobal('document', {
    querySelector: () => skipLink,
    documentElement: { scrollWidth: 1280, scrollHeight: 2000 },
    get activeElement() { return active; },
  });
});
afterEach(async () => { vi.unstubAllGlobals(); await fs.rm(output, { recursive: true, force: true }); });

function pagePort() {
  const screenshot = vi.fn(async (options: { path: string; fullPage: boolean }) => {
    const bytes = options.path.endsWith('-top-of-document.png') ? topOfDocumentBytes : options.fullPage ? fullPageBytes : viewportBytes;
    await fs.writeFile(options.path, bytes);
    return bytes;
  });
  const evaluate = vi.fn(async (read: (argument?: unknown) => unknown, argument?: unknown) => read(argument));
  return { page: { screenshot, evaluate } as unknown as Page, screenshot, evaluate };
}

describe('creator capture custody through explicit synthetic DOM/image ports, not browser pixels', () => {
  it('preserves the original full-page and viewport/state pair before an explicit additional camera capture, then restores scroll without changing focus', async () => {
    const { page, screenshot } = pagePort();
    const receipt = await captureCreatorSignedOutEvidence(page, 'chromium-desktop', output, exactHead);
    expect(screenshot.mock.calls.map(([o]) => [path.basename(o.path), o.fullPage])).toEqual([
      ['chromium-desktop-creator-signed-out.png', true],
      ['chromium-desktop-creator-signed-out-viewport.png', false],
      ['chromium-desktop-creator-signed-out-top-of-document.png', true],
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
    expect(scrollY).toBe(460);
    expect(active.tagName).toBe('BUTTON');
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
    const additional = await fs.readFile(path.join(output, 'chromium-tablet-creator-top-of-document-camera.json'), 'utf8');
    expect(additional).not.toContain('synthetic-private-');
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

  it('retains distinct additional whole-page bytes and hash-bound camera geometry without replacing original evidence', async () => {
    const { page } = pagePort();
    await captureCreatorSignedOutEvidence(page, 'chromium-desktop', output, exactHead);
    const additional = JSON.parse(await fs.readFile(path.join(output, 'chromium-desktop-creator-top-of-document-camera.json'), 'utf8'));
    expect(additional.exactHead).toBe(exactHead);
    expect(additional.stage).toBe('creator-signed-out-additional-top-of-document-camera');
    expect(additional.cameraPositioningPerformed).toBe(true);
    expect(additional.beforePositioning.scroll.y).toBe(460);
    expect(additional.afterPositioning.scroll.y).toBe(0);
    expect(additional.afterFullPage.scroll.y).toBe(0);
    expect(additional.afterRestoration.scroll.y).toBe(460);
    expect(additional.image.sha256).toBe(createHash('sha256').update(topOfDocumentBytes).digest('hex'));
    expect(additional.image.bytes).toBe(topOfDocumentBytes.length);
    expect(additional.visualAcceptance).toBe(false);
    expect(additional.productStateNormalizationPerformed).toBe(false);
    expect(await fs.readFile(path.join(output, 'chromium-desktop-creator-signed-out.png'))).toEqual(fullPageBytes);
    expect(await fs.readFile(path.join(output, 'chromium-desktop-creator-signed-out-viewport.png'))).toEqual(viewportBytes);
  });

  it('keeps a focused skip link focused and visible through positioning, additional capture and restoration', async () => {
    active = skipLink;
    const { page, screenshot } = pagePort();
    screenshot.mockImplementation(async (options) => {
      expect(active).toBe(skipLink);
      expect(skipLink.matches(':focus-visible')).toBe(true);
      expect(skipLink.getBoundingClientRect().top).toBe(16);
      const bytes = options.path.endsWith('-top-of-document.png') ? topOfDocumentBytes : options.fullPage ? fullPageBytes : viewportBytes;
      await fs.writeFile(options.path, bytes); return bytes;
    });
    await captureCreatorSignedOutEvidence(page, 'chromium-desktop', output, exactHead);
    const additional = JSON.parse(await fs.readFile(path.join(output, 'chromium-desktop-creator-top-of-document-camera.json'), 'utf8'));
    for (const stage of ['beforePositioning', 'afterPositioning', 'afterFullPage', 'afterRestoration']) {
      expect(additional[stage].activeElement).toEqual({ tagName: 'a', isSkipLink: true });
      expect(additional[stage].skipLink.focused).toBe(true);
      expect(additional[stage].skipLink.focusVisible).toBe(true);
      expect(additional[stage].skipLink.viewportIntersection.height).toBe(44);
    }
    expect(active).toBe(skipLink);
    expect(scrollY).toBe(460);
  });

  it('fails if the camera cannot reach the document top and preserves the already completed original pair', async () => {
    vi.mocked(window.scrollTo).mockImplementation(() => {});
    const { page, screenshot } = pagePort();
    await expect(captureCreatorSignedOutEvidence(page, 'chromium-desktop', output, exactHead)).rejects.toThrow('did not reach the top of the document');
    expect(screenshot).toHaveBeenCalledTimes(2);
    expect(await fs.readFile(path.join(output, 'chromium-desktop-creator-signed-out.png'))).toEqual(fullPageBytes);
    expect(JSON.parse(await fs.readFile(path.join(output, 'chromium-desktop-creator-capture-state.json'), 'utf8')).images).toHaveLength(2);
    expect(await fs.readdir(output)).not.toContain('chromium-desktop-creator-top-of-document-camera.json');
  });

  it('fails an additional screenshot error, restores the prior camera and leaves original evidence intact', async () => {
    const { page, screenshot } = pagePort();
    screenshot.mockImplementationOnce(async (options) => { await fs.writeFile(options.path, fullPageBytes); return fullPageBytes; });
    screenshot.mockImplementationOnce(async (options) => { await fs.writeFile(options.path, viewportBytes); return viewportBytes; });
    screenshot.mockRejectedValueOnce(new Error('additional capture failed'));
    await expect(captureCreatorSignedOutEvidence(page, 'chromium-desktop', output, exactHead)).rejects.toThrow('additional capture failed');
    expect(scrollY).toBe(460);
    expect(active.tagName).toBe('BUTTON');
    expect(await fs.readdir(output)).not.toContain('chromium-desktop-creator-top-of-document-camera.json');
    expect(await fs.readFile(path.join(output, 'chromium-desktop-creator-signed-out-viewport.png'))).toEqual(viewportBytes);
  });

  it('fails restoration drift without writing a complete additional receipt or discarding captured bytes', async () => {
    vi.mocked(window.scrollTo).mockImplementation(((options: ScrollToOptions) => { if (options.top === 0) scrollY = 0; }) as typeof window.scrollTo);
    const { page } = pagePort();
    await expect(captureCreatorSignedOutEvidence(page, 'chromium-desktop', output, exactHead)).rejects.toThrow('did not reach the pre-additional camera position');
    expect(await fs.readFile(path.join(output, 'chromium-desktop-creator-signed-out-top-of-document.png'))).toEqual(topOfDocumentBytes);
    expect(await fs.readdir(output)).not.toContain('chromium-desktop-creator-top-of-document-camera.json');
  });

  it('rejects observed focus drift instead of repairing or hiding it to obtain camera success', async () => {
    const { page, screenshot } = pagePort();
    screenshot.mockImplementationOnce(async (options) => { await fs.writeFile(options.path, fullPageBytes); return fullPageBytes; });
    screenshot.mockImplementationOnce(async (options) => { await fs.writeFile(options.path, viewportBytes); return viewportBytes; });
    screenshot.mockImplementationOnce(async (options) => { active = { tagName: 'INPUT' }; await fs.writeFile(options.path, topOfDocumentBytes); return topOfDocumentBytes; });
    await expect(captureCreatorSignedOutEvidence(page, 'chromium-desktop', output, exactHead)).rejects.toThrow('Creator additional camera capture and restoration failed');
    expect(active.tagName).toBe('INPUT');
    expect(scrollY).toBe(460);
    expect(await fs.readdir(output)).not.toContain('chromium-desktop-creator-top-of-document-camera.json');
  });
});
