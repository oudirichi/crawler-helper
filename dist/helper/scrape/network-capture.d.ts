import { z } from 'zod';
import type { Page } from 'puppeteer-core';
interface networkFilterSchema {
    filterType: 'url';
    matchType: 'contains';
    value: string;
    httpResponseBody?: boolean;
}
declare const NetworkFilterSchema: z.ZodType<networkFilterSchema>;
export type NetworkFilter = z.infer<typeof NetworkFilterSchema>;
export type FilterType = NetworkFilter['filterType'];
export type MatchType = NetworkFilter['matchType'];
export interface NetworkCaptureEntry {
    url: string;
    status: number;
    httpResponseBody?: string;
}
export declare function validateFilters(filters: NetworkFilter[]): void;
export declare function attachNetworkCapture(page: Page, filters: NetworkFilter[]): NetworkCaptureEntry[];
export {};
