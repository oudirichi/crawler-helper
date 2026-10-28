import { z } from 'zod';
import { type ActionCommand, type CssSelector } from '../command';
export interface TypeAction {
    action: 'type';
    selector: CssSelector;
    text: string;
    delay?: number;
}
declare const schema: z.ZodType<TypeAction>;
export declare const typeCommand: ActionCommand<typeof schema>;
export {};
