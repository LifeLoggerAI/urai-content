import type { Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Fixed allowlist only: never retain URLs, form values, content, tokens or identity.
// Measurements observe existing state. They do not focus, scroll or hide any UI.
async function observeCreatorCaptureState(page: Page) {
  return page.evaluate(() => {
    const skipLink = document.querySelector<HTMLElement>('.skip-link');
    const rect = skipLink?.getBoundingClientRect();
    const visualViewport = window.visualViewport;
    return {
      scroll: { x: window.scrollX, y: window.scrollY },
      viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
      visualViewport: visualViewport ? {
        width: visualViewport.width, height: visualViewport.height,
        offsetLeft: visualViewport.offsetLeft, offsetTop: visualViewport.offsetTop,
        pageLeft: visualViewport.pageLeft, pageTop: visualViewport.pageTop, scale: visualViewport.scale,
      } : null,
      document: { scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight },
      activeElement: { tagName: document.activeElement?.tagName.toLowerCase() ?? null, isSkipLink: document.activeElement === skipLink && skipLink !== null },
      skipLink: rect && skipLink ? {
        present: true,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left },
        focused: skipLink.matches(':focus'), focusVisible: skipLink.matches(':focus-visible'),
        viewportIntersection: {
          width: Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0)),
          height: Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)),
        },
      } : { present: false },
    };
  });
}

export async function captureCreatorSignedOutEvidence(page: Page, projectName: string, output: string, exactHead: string | null) {
  await fs.mkdir(output, { recursive: true });
  const fullPageName = projectName + '-creator-signed-out.png';
  const viewportName = projectName + '-creator-signed-out-viewport.png';
  const beforeFullPage = await observeCreatorCaptureState(page);
  // Preserve the existing image name and fullPage capture before adding evidence.
  const fullPage = await page.screenshot({ path: path.join(output, fullPageName), fullPage: true });
  const afterFullPage = await observeCreatorCaptureState(page);
  const viewport = await page.screenshot({ path: path.join(output, viewportName), fullPage: false });
  const afterViewport = await observeCreatorCaptureState(page);
  const receipt = {
    schemaVersion: 'urai-content-creator-capture-state-1',
    exactHead, projectName, capturedAtUTC: new Date().toISOString(),
    stage: 'creator-signed-out',
    normalizationPerformed: false, accessibilityBehaviorChanged: false,
    privateInputValuesRetained: false, visualAcceptance: false,
    beforeFullPage, afterFullPage, afterViewport,
    images: [
      { file: fullPageName, fullPage: true, bytes: fullPage.length, sha256: createHash('sha256').update(fullPage).digest('hex') },
      { file: viewportName, fullPage: false, bytes: viewport.length, sha256: createHash('sha256').update(viewport).digest('hex') },
    ],
  };
  // A complete paired receipt is written only after both captures and observations.
  await fs.writeFile(path.join(output, projectName + '-creator-capture-state.json'), JSON.stringify(receipt, null, 2));
  return receipt;
}
