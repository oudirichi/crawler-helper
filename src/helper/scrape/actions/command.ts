import { z } from 'zod';
import type { Page } from 'puppeteer-core';

// ─── Shared selector schema ─────────────────────────────────────────────────

interface CssSelectorSchemaInterface {
  type: 'css';
  value: string;
  state?: 'attached'
}

export const CssSelectorSchema: z.ZodType<CssSelectorSchemaInterface> = z.preprocess(
  (val) => (typeof val === 'string' ? { type: 'css', value: val } : val),
  z.object({
    type: z.literal('css'),
    value: z.string().min(1),
    state: z.literal('attached').optional(),
  }),
);

export type CssSelector = z.infer<typeof CssSelectorSchema>;

// ─── Command contract ─────────────────────────────────────────────────────────

/**
 * The tail of a one-line shorthand string, after the leading verb token has been
 * peeled off (e.g. for `"type:120 #q hello"` → `{ modifier: '120', rest: '#q hello' }`).
 */
export interface ShorthandParts {
  /** The token after `:` in the verb head, or `undefined` when none was given. */
  modifier?: string;
  /** Everything after the verb token, left-trimmed. */
  rest: string;
}

/**
 * One self-contained browser action: its schema (object form), how to parse its
 * string shorthand, and how to execute it against a live page. Adding an action
 * means adding a command and registering it — no control flow elsewhere changes.
 *
 * `parseShorthand`/`execute` are declared as methods (not arrow properties) so the
 * registry can hold the commands in a single heterogeneous collection: method
 * parameters are bivariant, letting `ActionCommand<SpecificSchema>` satisfy the
 * erased `ActionCommand` the registry stores.
 */
export interface ActionCommand<Schema extends z.ZodType = z.ZodType> {
  /** The action verb, matching the schema's `action` literal. */
  readonly name: string;
  /** Zod schema for this action's canonical object form. */
  readonly schema: Schema;
  /** Turn the shorthand tail into a canonical action object (pre-validation). */
  parseShorthand(parts: ShorthandParts): unknown;
  /** Run the action against a puppeteer page. */
  execute(page: Page, action: z.infer<Schema>): Promise<unknown> | unknown;
}
