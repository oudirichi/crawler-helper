import { z } from 'zod';
import { type ActionCommand, type CssSelector, CssSelectorSchema } from '../command';
import { splitSelectorPayload, toNumber } from '../shorthand';

export interface TypeAction {
  action: 'type';
  selector: CssSelector;
  text: string;
  delay?: number;
}

const schema: z.ZodType<TypeAction> = z.object({
  action: z.literal('type'),
  selector: CssSelectorSchema,
  text: z.string(),
  delay: z.number().optional(),
});

export const typeCommand: ActionCommand<typeof schema> = {
  name: 'type',
  schema,
  parseShorthand({ modifier, rest }) {
    const { selector, payload } = splitSelectorPayload(rest);
    if (!selector) throw new Error('type requires a selector');
    if (!payload) throw new Error('type requires text');
    return modifier === undefined
      ? { action: 'type', selector, text: payload }
      : { action: 'type', selector, text: payload, delay: toNumber('type delay', modifier) };
  },
  execute(page, a) {
    return page.type(a.selector.value, a.text, { delay: a.delay });
  },
};
