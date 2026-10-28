import { z } from 'zod';
import { type ActionCommand, type CssSelector } from '../command';
export interface ScrollAction {
    action: 'scroll';
    selector: CssSelector;
}
declare const schema: z.ZodType<ScrollAction>;
export declare const scrollCommand: ActionCommand<typeof schema>;
export {};
