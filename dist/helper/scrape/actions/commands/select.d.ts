import { z } from 'zod';
import { type ActionCommand, type CssSelector } from '../command';
export interface SelectAction {
    action: 'select';
    selector: CssSelector;
    values: string[];
}
declare const schema: z.ZodType<SelectAction>;
export declare const selectCommand: ActionCommand<typeof schema>;
export {};
