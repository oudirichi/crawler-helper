import type { HTTPResponse, Page } from 'puppeteer-core';
import { unsupportedValueError } from './shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FilterType = 'url';
export type MatchType = 'contains';

export interface NetworkFilter {
  filterType: FilterType;
  matchType: MatchType;
  value: string;
  httpResponseBody?: boolean;
}

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

const SUPPORTED_FILTER_TYPES = ['url'] as const satisfies readonly FilterType[];
const SUPPORTED_MATCH_TYPES = ['contains'] as const satisfies readonly MatchType[];

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateFilters(filters: NetworkFilter[]): void {
  filters.forEach((filter, i) => {
    if (!SUPPORTED_FILTER_TYPES.includes(filter.filterType)) {
      throw unsupportedValueError(
        `networkCapture[${i}].filterType`,
        filter.filterType,
        SUPPORTED_FILTER_TYPES,
      );
    }
    if (!SUPPORTED_MATCH_TYPES.includes(filter.matchType)) {
      throw unsupportedValueError(
        `networkCapture[${i}].matchType`,
        filter.matchType,
        SUPPORTED_MATCH_TYPES,
      );
    }
    if (typeof filter.value !== 'string') {
      throw new Error(`networkCapture[${i}].value: must be a string`);
    }
  });
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
        entry.httpResponseBody = await response.text();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        process.stderr.write(`warn: failed to read body for ${url}: ${msg}\n`);
      }
    }

    captured.push(entry);
  });

  return captured;
}
