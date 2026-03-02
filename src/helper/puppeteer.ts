import puppeteer, { type Browser, type Page } from 'puppeteer-core';
import envPaths from 'env-paths';

const paths = envPaths('crawler', { suffix: '' });

const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-blink-features=AutomationControlled',
] as const;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36';

export function launch(args: string[]|undefined = undefined): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ?? '/usr/bin/chromium',
    args: args ?? [...LAUNCH_ARGS],
    userDataDir: paths.cache,
  });
}

export async function openPage(browser: Browser, url: string, agent: string|undefined = undefined): Promise<Page> {
  const [page] = await browser.pages();

  await page.setViewport({ width: 1024, height: 880 });
  await page.setUserAgent(agent ?? USER_AGENT);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

  return page;
}

export async function getContentForAddress(
  url: string,
  callback: ((page: Page) => Promise<void>)|undefined = undefined,
): Promise<string> {
  const browser = await launch();

  try {
    const page = await openPage(browser, url);

    if (callback) {
      await callback(page);
    }

    return await page.content();
  } finally {
    await browser.close();
  }
}
