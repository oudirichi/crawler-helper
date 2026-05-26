import type { Page } from 'puppeteer-core';
import { unsupportedValueError } from './shared';

// ─── Types ────────────────────────────────────────────────────────────────────

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

export type ActionName = Action['action'];

// ─── Handler registry (OCP: add a row to extend, never edit control flow) ─────

type ActionFor<K extends ActionName> = Extract<Action, { action: K }>;
type Handlers = { [K in ActionName]: (page: Page, a: ActionFor<K>) => Promise<unknown> | unknown };

const HANDLERS = {
  click: (p, a) => p.click(a.selector.value, { button: a.button ?? 'left', delay: a.delay }),
  type: (p, a) => p.type(a.selector.value, a.text, { delay: a.delay }),
  select: (p, a) => p.select(a.selector.value, ...a.values),
  waitForSelector: (p, a) =>
    p.waitForSelector(a.selector.value, { timeout: a.timeout ?? 30_000 }),
  hover: (p, a) => p.hover(a.selector.value),
  scroll: (p, a) =>
    p.$eval(a.selector.value, (el) =>
      el.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'center' }),
    ),
} satisfies Handlers;

const SUPPORTED_ACTIONS = Object.keys(HANDLERS) as ActionName[];

// ─── Validation ───────────────────────────────────────────────────────────────

function validateSelector(selector: unknown, path: string): void {
  if (!selector || typeof selector !== 'object') {
    throw new Error(`${path}.selector: must be an object`);
  }
  const s = selector as Record<string, unknown>;
  if (s.type !== 'css') {
    throw unsupportedValueError(`${path}.selector.type`, s.type, ['css']);
  }
  if (typeof s.value !== 'string' || s.value === '') {
    throw new Error(`${path}.selector.value: must be a non-empty string`);
  }
  if (s.state !== undefined && s.state !== 'attached') {
    throw unsupportedValueError(`${path}.selector.state`, s.state, ['attached']);
  }
}

export function validateActions(actions: Action[]): void {
  actions.forEach((a, i) => {
    const path = `actions[${i}]`;
    if (!SUPPORTED_ACTIONS.includes(a.action)) {
      throw unsupportedValueError(`${path}.action`, a.action, SUPPORTED_ACTIONS);
    }
    validateSelector((a as Record<string, unknown>).selector, path);
    if (a.action === 'type' && typeof a.text !== 'string') {
      throw new Error(`${path}.text: must be a string (required for "type" action)`);
    }
    if (a.action === 'select' && (!Array.isArray(a.values) || a.values.length === 0)) {
      throw new Error(`${path}.values: must be a non-empty string array (required for "select" action)`);
    }
  });
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runActions(page: Page, actions: Action[]): Promise<void> {
  for (const [i, a] of actions.entries()) {
    try {
      const handler = HANDLERS[a.action] as (page: Page, a: Action) => Promise<unknown>;
      await handler(page, a);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`action[${i}] ${a.action}: ${msg}`, { cause: err });
    }
  }
}
