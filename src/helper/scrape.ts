import type { HTTPResponse, Page } from 'puppeteer-core';
import { launch } from './puppeteer';

const SUPPORTED_FILTER_TYPES = ['url'] as const;
const SUPPORTED_MATCH_TYPES = ['contains'] as const;

export type FilterType = (typeof SUPPORTED_FILTER_TYPES)[number];
export type MatchType = (typeof SUPPORTED_MATCH_TYPES)[number];

export interface NetworkFilter {
  filterType: FilterType;
  matchType: MatchType;
  value: string;
  httpResponseBody?: boolean;
}

export interface ScrapeOptions {
  screenshot?: boolean;
  networkCapture?: NetworkFilter[];
}

export interface NetworkCaptureEntry {
  url: string;
  status: number;
  httpResponseBody?: string;
}

export interface ScrapeResult {
  screenshot?: string;
  networkCapture: NetworkCaptureEntry[];
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36';

function validateFilters(filters: NetworkFilter[]): void {
  filters.forEach((filter, index) => {
    if (!SUPPORTED_FILTER_TYPES.includes(filter.filterType)) {
      throw new Error(
        `networkCapture[${index}].filterType: unsupported value "${filter.filterType}" ` +
          `(supported: ${SUPPORTED_FILTER_TYPES.join(', ')})`,
      );
    }
    if (!SUPPORTED_MATCH_TYPES.includes(filter.matchType)) {
      throw new Error(
        `networkCapture[${index}].matchType: unsupported value "${filter.matchType}" ` +
          `(supported: ${SUPPORTED_MATCH_TYPES.join(', ')})`,
      );
    }
    if (typeof filter.value !== 'string') {
      throw new Error(`networkCapture[${index}].value: must be a string`);
    }
  });
}

function filterMatches(filter: NetworkFilter, url: string): boolean {
  if (filter.filterType === 'url' && filter.matchType === 'contains') {
    return url.includes(filter.value);
  }
  return false;
}

function buildResponseHandler(
  filters: NetworkFilter[],
  out: NetworkCaptureEntry[],
): (response: HTTPResponse) => Promise<void> {
  return async (response) => {
    const url = response.url();
    const matched = filters.filter((f) => filterMatches(f, url));
    if (matched.length === 0) {
      return;
    }

    const entry: NetworkCaptureEntry = {
      url,
      status: response.status(),
    };

    const wantsBody = matched.some((f) => f.httpResponseBody === true);
    if (wantsBody) {
      try {
        entry.httpResponseBody = await response.text();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(`warn: failed to read body for ${url}: ${message}\n`);
      }
    }

    out.push(entry);
  };
}

export async function scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
  const filters = options.networkCapture ?? [];
  validateFilters(filters);

  const captured: NetworkCaptureEntry[] = [];
  const browser = await launch();

  try {
    const [page]: Page[] = await browser.pages();
    await page.setViewport({ width: 1024, height: 880 });
    await page.setUserAgent(USER_AGENT);

    if (filters.length > 0) {
      page.on('response', buildResponseHandler(filters, captured));
    }

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    const result: ScrapeResult = { networkCapture: captured };

    if (options.screenshot === true) {
      result.screenshot = (await page.screenshot({ encoding: 'base64', type: 'png' })) as string;
    }

    return result;
  } finally {
    await browser.close();
  }
}
