import { z } from 'zod';
import { type ActionCommand, type CssSelector, CssSelectorSchema } from '../command';
import { toNumber } from '../shorthand';

export interface ClickAction {
  action: 'click';
  selector: CssSelector;
  button?: 'left' | 'right' | 'middle';
  delay?: number;
}

const schema: z.ZodType<ClickAction> = z.object({
  action: z.literal('click'),
  selector: CssSelectorSchema,
  button: z.enum(['left', 'right', 'middle']).optional(),
  delay: z.number().optional(),
});

export const clickCommand: ActionCommand<typeof schema> = {
  name: 'click',
  schema,
  parseShorthand({ modifier, rest }) {
    if (!rest) throw new Error('click requires a selector');
    return modifier === undefined
      ? { action: 'click', selector: rest }
      : { action: 'click', selector: rest, delay: toNumber('click delay', modifier) };
  },
  execute(page, a) {
    return page.click(a.selector.value, { button: a.button ?? 'left', delay: a.delay });
  },
};
