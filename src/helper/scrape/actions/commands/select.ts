import { z } from 'zod';
import { type ActionCommand, type CssSelector, CssSelectorSchema } from '../command';
import { splitSelectorPayload } from '../shorthand';

export interface SelectAction {
  action: 'select';
  selector: CssSelector;
  values: string[];
}

const schema: z.ZodType<SelectAction> = z.object({
  action: z.literal('select'),
  selector: CssSelectorSchema,
  values: z.string().array().min(1),
});

export const selectCommand: ActionCommand<typeof schema> = {
  name: 'select',
  schema,
  parseShorthand({ modifier, rest }) {
    if (modifier !== undefined) throw new Error('select takes no ":" modifier');
    const { selector, payload } = splitSelectorPayload(rest);
    if (!selector) throw new Error('select requires a selector');
    if (!payload) throw new Error('select requires a value');
    return { action: 'select', selector, values: [payload] };
  },
  execute(page, a) {
    return page.select(a.selector.value, ...a.values);
  },
};
