import { z } from 'zod';
import type { ActionCommand } from '../command';
export interface WaitForTimeoutAction {
    action: 'waitForTimeout';
    timeout: number;
}
declare const schema: z.ZodType<WaitForTimeoutAction>;
export declare const waitForTimeoutCommand: ActionCommand<typeof schema>;
export {};
