export type PageCursor = {
  sortValue: string;
  id: string;
};

export type PageRequest = {
  limit?: number;
  cursor?: string | null;
};

export type PageResult<T> = {
  items: T[];
  nextCursor: string | null;
};

export function normalizePageLimit(limit: number | undefined, fallback = 25, maximum = 100): number {
  const value = limit ?? fallback;
  if (!Number.isInteger(value) || value < 1) throw new Error('Pagination limit must be a positive integer');
  return Math.min(value, maximum);
}

export function encodePageCursor(cursor: PageCursor): string {
  if (!cursor.sortValue || !cursor.id) throw new Error('Pagination cursor requires sortValue and id');
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodePageCursor(value: string): PageCursor {
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Partial<PageCursor>;
    if (!parsed.sortValue || !parsed.id) throw new Error('missing fields');
    return { sortValue: parsed.sortValue, id: parsed.id };
  } catch {
    throw new Error('Malformed pagination cursor');
  }
}

export function paginateSorted<T>(
  sorted: T[],
  request: PageRequest,
  key: (item: T) => PageCursor,
): PageResult<T> {
  const limit = normalizePageLimit(request.limit);
  let start = 0;
  if (request.cursor) {
    const decoded = decodePageCursor(request.cursor);
    const index = sorted.findIndex((item) => {
      const current = key(item);
      return current.sortValue === decoded.sortValue && current.id === decoded.id;
    });
    if (index < 0) throw new Error('Stale pagination cursor');
    start = index + 1;
  }
  const items = sorted.slice(start, start + limit);
  const last = items.at(-1);
  const hasMore = start + items.length < sorted.length;
  return { items, nextCursor: last && hasMore ? encodePageCursor(key(last)) : null };
}
