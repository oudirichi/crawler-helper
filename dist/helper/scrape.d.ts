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
export declare function scrape(url: string, options?: ScrapeOptions): Promise<ScrapeResult>;
