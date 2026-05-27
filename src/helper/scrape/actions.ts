import { z } from 'zod';
import type { Page } from 'puppeteer-core';
import { sleep } from '../sleep';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CssSelectorSchema = z.preprocess(
  (val) => (typeof val === 'string' ? { type: 'css', value: val } : val),
  z.object({
    type: z.literal('css'),
    value: z.string().min(1),
    state: z.literal('attached').optional(),
  }),
);

const ActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('click'), selector: CssSelectorSchema, button: z.enum(['left', 'right', 'middle']).optional(), delay: z.number().optional() }),
  z.object({ action: z.literal('type'), selector: CssSelectorSchema, text: z.string(), delay: z.number().optional() }),
  z.object({ action: z.literal('select'), selector: CssSelectorSchema, values: z.string().array().min(1) }),
  z.object({ action: z.literal('waitForTimeout'), timeout: z.number() }),
  z.object({ action: z.literal('waitForSelector'), selector: CssSelectorSchema, timeout: z.number().optional() }),
  z.object({ action: z.literal('hover'), selector: CssSelectorSchema }),
  z.object({ action: z.literal('scroll'), selector: CssSelectorSchema }),
]);

// ─── Types ────────────────────────────────────────────────────────────────────

export type CssSelector = z.infer<typeof CssSelectorSchema>;
export type Action = z.infer<typeof ActionSchema>;
export type ActionName = Action['action'];

// ─── Handler registry (OCP: add a row to extend, never edit control flow) ─────

type ActionFor<K extends ActionName> = Extract<Action, { action: K }>;
type Handlers = { [K in ActionName]: (page: Page, a: ActionFor<K>) => Promise<unknown> | unknown };

const HANDLERS = {
  waitForTimeout: (_p, a) => sleep(a.timeout * 1000),
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

// ─── Validation ───────────────────────────────────────────────────────────────

function formatPath(path: (string | number | symbol)[]): string {
  return path.reduce<string>(
    (acc, key) => (typeof key === 'number' ? `${acc}[${key}]` : `${acc}.${String(key)}`),
    '',
  );
}

export function validateActions(actions: Action[]): void {
  const result = z.array(ActionSchema).safeParse(actions);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `actions${formatPath(issue.path)}: ${issue.message}`)
      .join('; ');
    throw new Error(issues);
  }
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
