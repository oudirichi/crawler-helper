import { z } from 'zod';
import type { ActionCommand } from './command';
import { clickCommand, type ClickAction } from './commands/click';
import { typeCommand, type TypeAction } from './commands/type';
import { selectCommand, type SelectAction } from './commands/select';
import { waitForTimeoutCommand, type WaitForTimeoutAction } from './commands/wait-for-timeout';
import { waitForSelectorCommand, type WaitForSelectorAction } from './commands/wait-for-selector';
import { hoverCommand, type HoverAction } from './commands/hover';
import { scrollCommand, type ScrollAction } from './commands/scroll';

/**
 * The single source of truth for supported actions. Everything else — the
 * validation schema, shorthand parsing and execution — is derived from this list,
 * so extending the surface is a one-line registration (plus the command file).
 */
export const COMMANDS: readonly ActionCommand[] = [
  clickCommand,
  typeCommand,
  selectCommand,
  waitForTimeoutCommand,
  waitForSelectorCommand,
  hoverCommand,
  scrollCommand,
];

/** The canonical object form of every supported action. */
export type Action =
  | ClickAction
  | TypeAction
  | SelectAction
  | WaitForTimeoutAction
  | WaitForSelectorAction
  | HoverAction
  | ScrollAction;

export type ActionName = Action['action'];

type SchemaTuple = [z.ZodObject, ...z.ZodObject[]];

/**
 * Discriminated union over every command's object schema. The members are erased
 * to generic `ZodObject` (the commands hold them as `z.ZodType<…>`), so the result
 * is re-asserted to `z.ZodType<Action>` — runtime validation is unaffected.
 */
export const ActionSchema: z.ZodType<Action> = z.discriminatedUnion(
  'action',
  COMMANDS.map((c) => c.schema) as unknown as SchemaTuple,
) as unknown as z.ZodType<Action>;

const BY_NAME: ReadonlyMap<string, ActionCommand> = new Map(
  COMMANDS.map((c) => [c.name, c]),
);

/** Look up the command for an action verb, or `undefined` if none is registered. */
export function commandFor(name: string): ActionCommand | undefined {
  return BY_NAME.get(name);
}
