import { z } from 'zod';
import { type ActionCommand, type CssSelector, CssSelectorSchema } from '../command';
import { parseSelectorOnly } from '../shorthand';

export interface HoverAction {
  action: 'hover';
  selector: CssSelector;
}

const schema: z.ZodType<HoverAction> = z.object({
  action: z.literal('hover'),
  selector: CssSelectorSchema,
});

export const hoverCommand: ActionCommand<typeof schema> = {
  name: 'hover',
  schema,
  parseShorthand: (parts) => parseSelectorOnly('hover', parts),
  execute(page, a) {
    return page.hover(a.selector.value);
  },
};
