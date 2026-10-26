import { launch } from './puppeteer';
import { validateFilters, attachNetworkCapture } from './scrape/network-capture';
import { validateActions, runActions } from './scrape/actions';

export type { NetworkFilter, NetworkCaptureEntry, FilterType, MatchType } from './scrape/network-capture';
export type { Action, ActionInput, CssSelector, ActionName } from './scrape/actions';

export interface ScrapeOptions {
  screenshot?: boolean;
  networkCapture?: import('./scrape/network-capture').NetworkFilter[];
  actions?: import('./scrape/actions').ActionInput[];
}

export interface ScrapeResult {
  browserHtml: string;
  screenshot?: string;
  networkCapture: import('./scrape/network-capture').NetworkCaptureEntry[];
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36';

export async function scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
  const filters = options.networkCapture ?? [];
  validateFilters(filters);
  const actions = validateActions(options.actions ?? []);

  const browser = await launch();
  try {
    const [page] = await browser.pages();
    await page.setViewport({ width: 1024, height: 880 });
    await page.setUserAgent(USER_AGENT);

    const captured = attachNetworkCapture(page, filters);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
    await runActions(page, actions);

    const result: ScrapeResult = { 
      networkCapture: captured,
      browserHtml: await page.content(),
     };
    if (options.screenshot === true) {
      result.screenshot = (await page.screenshot({ encoding: 'base64', type: 'png' })) as string;
    }
    return result;
  } finally {
    await browser.close();
  }
}
