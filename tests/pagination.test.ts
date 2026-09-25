import { describe, expect, it } from 'vitest';
import { decodePageCursor, encodePageCursor, normalizePageLimit, paginateSorted } from '../src/query/pagination.js';

describe('bounded pagination', () => {
  const items = [
    { id: 'a', updatedAt: '2026-09-23T03:00:00.000Z' },
    { id: 'b', updatedAt: '2026-09-23T02:00:00.000Z' },
    { id: 'c', updatedAt: '2026-09-23T01:00:00.000Z' },
  ];
  const key = (item: (typeof items)[number]) => ({ sortValue: item.updatedAt, id: item.id });

  it('uses deterministic opaque cursors and bounded limits', () => {
    const first = paginateSorted(items, { limit: 2 }, key);
    expect(first.items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(first.nextCursor).not.toBeNull();
    const second = paginateSorted(items, { limit: 2, cursor: first.nextCursor }, key);
    expect(second.items.map((item) => item.id)).toEqual(['c']);
    expect(second.nextCursor).toBeNull();
    expect(normalizePageLimit(1000)).toBe(100);
  });

  it('rejects malformed and stale cursors', () => {
    expect(() => decodePageCursor('not-a-cursor')).toThrow('Malformed pagination cursor');
    expect(() => paginateSorted(items, { cursor: encodePageCursor({ sortValue: 'old', id: 'missing' }) }, key)).toThrow('Stale pagination cursor');
  });
});
