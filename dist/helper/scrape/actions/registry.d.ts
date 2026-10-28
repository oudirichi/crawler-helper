import { z } from 'zod';
import type { ActionCommand } from './command';
import { type ClickAction } from './commands/click';
import { type TypeAction } from './commands/type';
import { type SelectAction } from './commands/select';
import { type WaitForTimeoutAction } from './commands/wait-for-timeout';
import { type WaitForSelectorAction } from './commands/wait-for-selector';
import { type HoverAction } from './commands/hover';
import { type ScrollAction } from './commands/scroll';
/**
 * The single source of truth for supported actions. Everything else — the
 * validation schema, shorthand parsing and execution — is derived from this list,
 * so extending the surface is a one-line registration (plus the command file).
 */
export declare const COMMANDS: readonly ActionCommand[];
/** The canonical object form of every supported action. */
export type Action = ClickAction | TypeAction | SelectAction | WaitForTimeoutAction | WaitForSelectorAction | HoverAction | ScrollAction;
export type ActionName = Action['action'];
/**
 * Discriminated union over every command's object schema. The members are erased
 * to generic `ZodObject` (the commands hold them as `z.ZodType<…>`), so the result
 * is re-asserted to `z.ZodType<Action>` — runtime validation is unaffected.
 */
export declare const ActionSchema: z.ZodType<Action>;
/** Look up the command for an action verb, or `undefined` if none is registered. */
export declare function commandFor(name: string): ActionCommand | undefined;
