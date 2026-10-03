import { describe, expect, it } from 'vitest';
import {
  createExportManifest,
  createNarratorSession,
  validateMarketplaceListing,
} from '../src/index.js';

describe('public expansion package contract', () => {
  it('exports deterministic export, narrator, and hard-off marketplace foundations', () => {
    expect(typeof createExportManifest).toBe('function');
    expect(typeof createNarratorSession).toBe('function');
    expect(typeof validateMarketplaceListing).toBe('function');
  });
});
