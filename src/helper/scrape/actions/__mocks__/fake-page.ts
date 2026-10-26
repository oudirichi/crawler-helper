import { vi } from 'vitest';
import type { Page } from 'puppeteer-core';

/** A puppeteer `Page` stand-in exposing only the methods commands call, as spies. */
export function fakePage() {
  const page = {
    click: vi.fn().mockResolvedValue(undefined),
    type: vi.fn().mockResolvedValue(undefined),
    select: vi.fn().mockResolvedValue([]),
    waitForSelector: vi.fn().mockResolvedValue(null),
    hover: vi.fn().mockResolvedValue(undefined),
    $eval: vi.fn().mockResolvedValue(undefined),
  };
  return { page, asPage: page as unknown as Page };
}
