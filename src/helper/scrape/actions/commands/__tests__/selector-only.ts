import { describe, expect, it } from 'vitest';
import type { ActionCommand } from '../../command';

/** Shared shorthand/schema contract for commands that take only a selector (hover, scroll). */
export function describeSelectorOnlyCommand(command: ActionCommand) {
  const { name } = command;

  describe(`${name} shorthand`, () => {
    it('parses a selector', () => {
      expect(command.parseShorthand({ rest: '#btn' })).toEqual({ action: name, selector: '#btn' });
    });

    it('rejects a ":" modifier', () => {
      expect(() => command.parseShorthand({ modifier: '5', rest: '#btn' })).toThrow('takes no ":" modifier');
    });

    it('requires a selector', () => {
      expect(() => command.parseShorthand({ rest: '' })).toThrow(`${name} requires a selector`);
    });
  });

  describe(`${name} schema`, () => {
    it('coerces a string selector to a css selector object', () => {
      const parsed = command.schema.parse({ action: name, selector: '#a' });
      expect(parsed).toEqual({ action: name, selector: { type: 'css', value: '#a' } });
    });

    it('rejects a missing selector', () => {
      expect(command.schema.safeParse({ action: name }).success).toBe(false);
    });
  });
}
