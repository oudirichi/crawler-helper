import { z } from 'zod';
import { type ActionCommand, type CssSelector, CssSelectorSchema } from '../command';
import { parseSelectorOnly } from '../shorthand';

export interface ScrollAction {
  action: 'scroll';
  selector: CssSelector;
}

const schema: z.ZodType<ScrollAction> = z.object({
  action: z.literal('scroll'),
  selector: CssSelectorSchema,
});

export const scrollCommand: ActionCommand<typeof schema> = {
  name: 'scroll',
  schema,
  parseShorthand: (parts) => parseSelectorOnly('scroll', parts),
  execute(page, a) {
    return page.$eval(a.selector.value, (el) =>
      el.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'center' }),
    );
  },
};
