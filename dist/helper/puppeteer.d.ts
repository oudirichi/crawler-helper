import { type Browser, type Page } from 'puppeteer-core';
export declare function launch(args?: string[] | undefined): Promise<Browser>;
export declare function openPage(browser: Browser, url: string, agent?: string | undefined): Promise<Page>;
export declare function getContentForAddress(url: string, callback?: ((page: Page) => Promise<void>) | undefined): Promise<string>;
