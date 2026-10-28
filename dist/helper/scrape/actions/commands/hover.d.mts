import { z } from 'zod';
import { type ActionCommand, type CssSelector } from '../command';
export interface HoverAction {
    action: 'hover';
    selector: CssSelector;
}
declare const schema: z.ZodType<HoverAction>;
export declare const hoverCommand: ActionCommand<typeof schema>;
export {};
