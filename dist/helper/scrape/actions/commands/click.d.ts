import { z } from 'zod';
import { type ActionCommand, type CssSelector } from '../command';
export interface ClickAction {
    action: 'click';
    selector: CssSelector;
    button?: 'left' | 'right' | 'middle';
    delay?: number;
}
declare const schema: z.ZodType<ClickAction>;
export declare const clickCommand: ActionCommand<typeof schema>;
export {};
