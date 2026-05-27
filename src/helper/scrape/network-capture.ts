import { z } from 'zod';
import type { HTTPResponse, Page } from 'puppeteer-core';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const NetworkFilterSchema = z.object({
  filterType: z.literal('url'),
  matchType: z.literal('contains'),
  value: z.string(),
  httpResponseBody: z.boolean().optional(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type NetworkFilter = z.infer<typeof NetworkFilterSchema>;
export type FilterType = NetworkFilter['filterType'];
export type MatchType = NetworkFilter['matchType'];

export interface NetworkCaptureEntry {
  url: string;
  status: number;
  httpResponseBody?: string;
}

// ─── Matcher registry (OCP: add a row to extend, never edit control flow) ─────

type MatcherKey = `${FilterType}/${MatchType}`;

const MATCHERS: Record<MatcherKey, (filterValue: string, url: string) => boolean> = {
  'url/contains': (v, url) => url.includes(v),
};

// ─── Validation ───────────────────────────────────────────────────────────────

function formatPath(path: (string | number | symbol)[]): string {
  return path.reduce<string>(
    (acc, key) => (typeof key === 'number' ? `${acc}[${key}]` : `${acc}.${String(key)}`),
    '',
  );
}

export function validateFilters(filters: NetworkFilter[]): void {
  const result = z.array(NetworkFilterSchema).safeParse(filters);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `networkCapture${formatPath(issue.path)}: ${issue.message}`)
      .join('; ');
    throw new Error(issues);
  }
}

// ─── Listener factory ─────────────────────────────────────────────────────────

function matches(filter: NetworkFilter, url: string): boolean {
  const key: MatcherKey = `${filter.filterType}/${filter.matchType}`;
  return MATCHERS[key]?.(filter.value, url) ?? false;
}

export function attachNetworkCapture(page: Page, filters: NetworkFilter[]): NetworkCaptureEntry[] {
  const captured: NetworkCaptureEntry[] = [];

  if (filters.length === 0) {
    return captured;
  }

  page.on('response', async (response: HTTPResponse) => {
    const url = response.url();
    const matched = filters.filter((f) => matches(f, url));
    if (matched.length === 0) return;

    const entry: NetworkCaptureEntry = { url, status: response.status() };

    if (matched.some((f) => f.httpResponseBody === true)) {
      try {
        const buf = await response.buffer();
        entry.httpResponseBody = buf.toString('base64');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        process.stderr.write(`warn: failed to read body for ${url}: ${msg}\n`);
      }
    }

    captured.push(entry);
  });

  return captured;
}
