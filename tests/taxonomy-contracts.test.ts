import { describe, expect, it } from 'vitest';
import {
  validateContentRelationships,
  validateTaxonomyTerms,
} from '../src/taxonomy/contracts.js';

describe('taxonomy and relationship contracts', () => {
  it('normalizes aliases and validates parent references', () => {
    const terms = validateTaxonomyTerms([
      { id: 'memory', slug: 'memory', label: 'Memory', parentId: null, aliases: [], status: 'active' },
      { id: 'ritual', slug: 'ritual', label: 'Ritual', parentId: 'memory', aliases: ['practice', 'practice'], status: 'active' },
    ]);
    expect(terms[1]?.aliases).toEqual(['practice']);
  });

  it('rejects duplicate slugs, unknown parents and self relationships', () => {
    expect(() => validateTaxonomyTerms([
      { id: 'a', slug: 'same', label: 'A', parentId: null, aliases: [], status: 'active' },
      { id: 'b', slug: 'same', label: 'B', parentId: null, aliases: [], status: 'active' },
    ])).toThrow('Duplicate taxonomy term slug');

    expect(() => validateTaxonomyTerms([
      { id: 'a', slug: 'a', label: 'A', parentId: 'missing', aliases: [], status: 'active' },
    ])).toThrow('Unknown taxonomy parent');

    expect(() => validateContentRelationships([
      { id: 'r1', fromId: 'a', toId: 'a', type: 'related', provenanceRecordId: 'p1' },
    ])).toThrow('cannot target itself');
  });
});
