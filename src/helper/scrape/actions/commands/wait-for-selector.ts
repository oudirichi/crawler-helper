import { z } from 'zod';
import { type ActionCommand, type CssSelector, CssSelectorSchema } from '../command';
import { toNumber } from '../shorthand';

const DEFAULT_TIMEOUT_MS = 30_000;

export interface WaitForSelectorAction {
  action: 'waitForSelector';
  selector: CssSelector;
  timeout?: number;
}

const schema: z.ZodType<WaitForSelectorAction> = z.object({
  action: z.literal('waitForSelector'),
  selector: CssSelectorSchema,
  timeout: z.number().optional(),
});

export const waitForSelectorCommand: ActionCommand<typeof schema> = {
  name: 'waitForSelector',
  schema,
  parseShorthand({ modifier, rest }) {
    if (!rest) throw new Error('waitForSelector requires a selector');
    return modifier === undefined
      ? { action: 'waitForSelector', selector: rest }
      : {
          action: 'waitForSelector',
          selector: rest,
          timeout: toNumber('waitForSelector timeout', modifier),
        };
  },
  execute(page, a) {
    return page.waitForSelector(a.selector.value, { timeout: a.timeout ?? DEFAULT_TIMEOUT_MS });
  },
};
