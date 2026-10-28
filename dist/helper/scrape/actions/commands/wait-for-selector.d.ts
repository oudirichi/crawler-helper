import { z } from 'zod';
import { type ActionCommand, type CssSelector } from '../command';
export interface WaitForSelectorAction {
    action: 'waitForSelector';
    selector: CssSelector;
    timeout?: number;
}
declare const schema: z.ZodType<WaitForSelectorAction>;
export declare const waitForSelectorCommand: ActionCommand<typeof schema>;
export {};
