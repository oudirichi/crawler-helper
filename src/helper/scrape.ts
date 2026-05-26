import type { HTTPResponse, Page } from 'puppeteer-core';
import { launch } from './puppeteer';

// ─── Network capture ──────────────────────────────────────────────────────────

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

export interface NetworkCaptureEntry {
  url: string;
  status: number;
  httpResponseBody?: string;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export interface CssSelector {
  type: 'css';
  value: string;
  state?: 'attached';
}

export type Action =
  | { action: 'click'; selector: CssSelector; button?: 'left' | 'right' | 'middle'; delay?: number }
  | { action: 'type'; selector: CssSelector; text: string; delay?: number }
  | { action: 'select'; selector: CssSelector; values: string[] }
  | { action: 'waitForSelector'; selector: CssSelector; timeout?: number }
  | { action: 'hover'; selector: CssSelector }
  | { action: 'scroll'; selector: CssSelector };

const SUPPORTED_ACTIONS = ['click', 'type', 'select', 'waitForSelector', 'hover', 'scroll'] as const;

// ─── Options / result ─────────────────────────────────────────────────────────

export interface ScrapeOptions {
  screenshot?: boolean;
  networkCapture?: NetworkFilter[];
  actions?: Action[];
}

export interface ScrapeResult {
  screenshot?: string;
  networkCapture: NetworkCaptureEntry[];
}

// ─── Validation ───────────────────────────────────────────────────────────────

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

function validateSelector(selector: unknown, path: string): void {
  if (!selector || typeof selector !== 'object') {
    throw new Error(`${path}.selector: must be an object`);
  }
  const s = selector as Record<string, unknown>;
  if (s.type !== 'css') {
    throw new Error(`${path}.selector.type: unsupported value "${String(s.type)}" (supported: css)`);
  }
  if (typeof s.value !== 'string' || s.value === '') {
    throw new Error(`${path}.selector.value: must be a non-empty string`);
  }
  if (s.state !== undefined && s.state !== 'attached') {
    throw new Error(`${path}.selector.state: unsupported value "${String(s.state)}" (supported: attached)`);
  }
}

function validateActions(actions: Action[]): void {
  actions.forEach((a, i) => {
    const path = `actions[${i}]`;
    if (!SUPPORTED_ACTIONS.includes(a.action as (typeof SUPPORTED_ACTIONS)[number])) {
      throw new Error(
        `${path}.action: unsupported value "${a.action}" ` +
          `(supported: ${SUPPORTED_ACTIONS.join(', ')})`,
      );
    }
    validateSelector((a as Record<string, unknown>).selector, path);
    if (a.action === 'type') {
      if (typeof a.text !== 'string') {
        throw new Error(`${path}.text: must be a string (required for "type" action)`);
      }
    }
    if (a.action === 'select') {
      if (!Array.isArray(a.values) || a.values.length === 0) {
        throw new Error(`${path}.values: must be a non-empty string array (required for "select" action)`);
      }
    }
  });
}

// ─── Action runner ────────────────────────────────────────────────────────────

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

async function runActions(page: Page, actions: Action[]): Promise<void> {
  for (const [i, a] of actions.entries()) {
    try {
      const css = a.selector.value;
      switch (a.action) {
        case 'click':
          await page.click(css, { button: a.button ?? 'left', delay: a.delay });
          break;
        case 'type':
          await page.type(css, a.text, { delay: a.delay });
          break;
        case 'select':
          await page.select(css, ...a.values);
          break;
        case 'waitForSelector':
          await page.waitForSelector(css, { timeout: a.timeout ?? 30_000 });
          break;
        case 'hover':
          await page.hover(css);
          break;
        case 'scroll':
          await page.$eval(css, (el) =>
            el.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'center' }),
          );
          break;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`action[${i}] ${a.action}: ${message}`, { cause: err });
    }
  }
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
  const filters = options.networkCapture ?? [];
  const actions = options.actions ?? [];
  validateFilters(filters);
  validateActions(actions);

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

    if (actions.length > 0) {
      await runActions(page, actions);
    }

    const result: ScrapeResult = { networkCapture: captured };

    if (options.screenshot === true) {
      result.screenshot = (await page.screenshot({ encoding: 'base64', type: 'png' })) as string;
    }

    return result;
  } finally {
    await browser.close();
  }
}
