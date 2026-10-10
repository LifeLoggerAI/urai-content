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
  await captureCreatorTopOfDocumentEvidence(page, projectName, output, exactHead);
  return receipt;
}

type CaptureState = Awaited<ReturnType<typeof observeCreatorCaptureState>>;

async function positionCaptureCamera(page: Page, scroll: { x: number; y: number }) {
  await page.evaluate(async ({ x, y }) => {
    // Explicit evidence camera movement only: no focus, CSS or keyboard changes.
    window.scrollTo({ left: x, top: y, behavior: 'instant' });
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }, scroll);
}

function requireCameraPosition(state: CaptureState, expected: { x: number; y: number }, stage: string) {
  if (state.scroll.x !== expected.x || state.scroll.y !== expected.y) {
    throw new Error('Creator capture camera did not reach ' + stage);
  }
}

function requireUnchangedFocus(before: CaptureState, after: CaptureState) {
  if (before.activeElement.tagName !== after.activeElement.tagName
    || before.activeElement.isSkipLink !== after.activeElement.isSkipLink
    || before.skipLink.focused !== after.skipLink.focused
    || before.skipLink.focusVisible !== after.skipLink.focusVisible) {
    throw new Error('Creator capture camera changed observed focus state');
  }
  if (before.activeElement.isSkipLink && (!after.skipLink.focused
    || !after.skipLink.viewportIntersection || after.skipLink.viewportIntersection.width <= 0
    || after.skipLink.viewportIntersection.height <= 0)) {
    throw new Error('Creator capture camera lost the focused skip link visibility');
  }
}

async function captureCreatorTopOfDocumentEvidence(page: Page, projectName: string, output: string, exactHead: string | null) {
  const beforePositioning = await observeCreatorCaptureState(page);
  const topOfDocument = { x: 0, y: 0 };
  const fullPageName = projectName + '-creator-signed-out-top-of-document.png';
  let captured: { image: Buffer; afterPositioning: CaptureState; afterFullPage: CaptureState } | undefined;
  let afterRestoration: CaptureState | undefined;
  let captureFailure: unknown;
  let restorationFailure: unknown;
  try {
    await positionCaptureCamera(page, topOfDocument);
    const afterPositioning = await observeCreatorCaptureState(page);
    requireCameraPosition(afterPositioning, topOfDocument, 'the top of the document');
    requireUnchangedFocus(beforePositioning, afterPositioning);
    const image = await page.screenshot({ path: path.join(output, fullPageName), fullPage: true });
    const afterFullPage = await observeCreatorCaptureState(page);
    requireCameraPosition(afterFullPage, topOfDocument, 'the top of the document after capture');
    requireUnchangedFocus(beforePositioning, afterFullPage);
    captured = { image, afterPositioning, afterFullPage };
  } catch (error) { captureFailure = error; }
  try {
    await positionCaptureCamera(page, beforePositioning.scroll);
    afterRestoration = await observeCreatorCaptureState(page);
    requireCameraPosition(afterRestoration, beforePositioning.scroll, 'the pre-additional camera position');
    requireUnchangedFocus(beforePositioning, afterRestoration);
  } catch (error) { restorationFailure = error; }
  if (captureFailure !== undefined && restorationFailure !== undefined) {
    throw new AggregateError([captureFailure, restorationFailure], 'Creator additional camera capture and restoration failed');
  }
  if (captureFailure !== undefined) throw captureFailure;
  if (restorationFailure !== undefined) throw restorationFailure;
  if (!captured || !afterRestoration) throw new Error('Creator additional camera evidence is incomplete');
  const receipt = {
    schemaVersion: 'urai-content-creator-top-of-document-camera-1',
    exactHead, projectName, capturedAtUTC: new Date().toISOString(),
    stage: 'creator-signed-out-additional-top-of-document-camera',
    cameraPositioningPerformed: true, requestedCameraPosition: topOfDocument,
    originalPostActionEvidencePreserved: true, preAdditionalCameraPositionRestored: true,
    productStateNormalizationPerformed: false, accessibilityBehaviorChanged: false,
    privateInputValuesRetained: false, visualAcceptance: false,
    beforePositioning, afterPositioning: captured.afterPositioning,
    afterFullPage: captured.afterFullPage, afterRestoration,
    image: { file: fullPageName, fullPage: true, bytes: captured.image.length, sha256: createHash('sha256').update(captured.image).digest('hex') },
  };
  // This additional receipt is complete only after capture and verified restoration.
  await fs.writeFile(path.join(output, projectName + '-creator-top-of-document-camera.json'), JSON.stringify(receipt, null, 2));
}
