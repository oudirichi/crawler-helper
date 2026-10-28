import type { Page } from 'puppeteer-core';
import { type Action } from './registry';
export type { CssSelector } from './command';
export type { Action, ActionName } from './registry';
/** An action as accepted on input: the full object form, or the string shorthand. */
export type ActionInput = Action | string;
/**
 * Parse the one-line string shorthand (e.g. `"type:120 #q hello world"`) into the
 * canonical action object. Splits off the leading verb (and optional `:modifier`)
 * then defers to the matching command. Field-level validation is left to the
 * schema; this only throws on shorthand-shape errors (unknown verb, missing parts).
 */
export declare function parseActionString(input: string): unknown;
export declare function validateActions(actions: ActionInput[]): Action[];
export declare function runActions(page: Page, actions: Action[]): Promise<void>;
