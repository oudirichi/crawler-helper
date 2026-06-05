import { z } from 'zod';
import type { Page } from 'puppeteer-core';
import { ActionSchema, commandFor, type Action } from './registry';

export type { CssSelector } from './command';
export type { Action, ActionName } from './registry';

/** An action as accepted on input: the full object form, or the string shorthand. */
export type ActionInput = Action | string;

// ─── String shorthand parser ────────────────────────────────────────────────

/**
 * Parse the one-line string shorthand (e.g. `"type:120 #q hello world"`) into the
 * canonical action object. Splits off the leading verb (and optional `:modifier`)
 * then defers to the matching command. Field-level validation is left to the
 * schema; this only throws on shorthand-shape errors (unknown verb, missing parts).
 */
export function parseActionString(input: string): unknown {
  const trimmed = input.trim();
  if (trimmed === '') throw new Error('empty action string');

  const firstSpace = trimmed.search(/\s/);
  const head = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace);
  const rest = firstSpace === -1 ? '' : trimmed.slice(firstSpace + 1).trimStart();

  const colon = head.indexOf(':');
  const verb = colon === -1 ? head : head.slice(0, colon);
  const modifier = colon === -1 ? undefined : head.slice(colon + 1);

  const command = commandFor(verb);
  if (!command) throw new Error(`unknown action "${verb}"`);
  return command.parseShorthand({ modifier, rest });
}

// ─── Validation ───────────────────────────────────────────────────────────────

function formatPath(path: (string | number | symbol)[]): string {
  return path.reduce<string>(
    (acc, key) => (typeof key === 'number' ? `${acc}[${key}]` : `${acc}.${String(key)}`),
    '',
  );
}

export function validateActions(actions: ActionInput[]): Action[] {
  const parsed = actions.map((a, i) => {
    if (typeof a !== 'string') return a;
    try {
      return parseActionString(a);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`actions[${i}]: ${msg}`, { cause: err });
    }
  });
  const result = z.array(ActionSchema).safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `actions${formatPath(issue.path)}: ${issue.message}`)
      .join('; ');
    throw new Error(issues);
  }
  return result.data as Action[];
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runActions(page: Page, actions: Action[]): Promise<void> {
  for (const [i, a] of actions.entries()) {
    try {
      const command = commandFor(a.action);
      if (!command) throw new Error(`no command registered for "${a.action}"`);
      await command.execute(page, a);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`action[${i}] ${a.action}: ${msg}`, { cause: err });
    }
  }
}
