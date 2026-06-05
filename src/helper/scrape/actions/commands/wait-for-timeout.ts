import { z } from 'zod';
import type { ActionCommand } from '../command';
import { toNumber } from '../shorthand';
import { sleep } from '../../../sleep';

export interface WaitForTimeoutAction {
  action: 'waitForTimeout';
  timeout: number;
}

const schema: z.ZodType<WaitForTimeoutAction> = z.object({
  action: z.literal('waitForTimeout'),
  timeout: z.number(),
});

export const waitForTimeoutCommand: ActionCommand<typeof schema> = {
  name: 'waitForTimeout',
  schema,
  parseShorthand({ modifier, rest }) {
    const raw = modifier !== undefined ? modifier : rest;
    if (raw.trim() === '') throw new Error('waitForTimeout requires a number');
    return { action: 'waitForTimeout', timeout: toNumber('waitForTimeout', raw) };
  },
  execute(_page, a) {
    return sleep(a.timeout * 1000);
  },
};
