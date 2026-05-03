import { describe, expect, it } from 'vitest';
import { registry } from '../src/lib/content/registry.js';
import { validateContent } from '../src/lib/content/validate.js';

describe('content registry', () => {
  it('loads canonical content', () => {
    expect(registry.home.slug).toBe('/');
    expect(registry.weeklyScrolls.length).toBeGreaterThan(0);
  });

  it('validates content without schema or safety violations', () => {
    expect(() => validateContent()).not.toThrow();
  });
});
