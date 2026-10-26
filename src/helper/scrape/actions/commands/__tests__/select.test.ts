import { describe, expect, it } from 'vitest';
import { selectCommand } from '../select';
import { fakePage } from '../../__mocks__/fake-page';

describe('select shorthand', () => {
  it('parses selector and a single value', () => {
    expect(selectCommand.parseShorthand({ rest: '#country CA' })).toEqual({
      action: 'select',
      selector: '#country',
      values: ['CA'],
    });
  });

  it('rejects a ":" modifier', () => {
    expect(() => selectCommand.parseShorthand({ modifier: '1', rest: '#c CA' })).toThrow('select takes no ":" modifier');
  });

  it('requires a selector', () => {
    expect(() => selectCommand.parseShorthand({ rest: '' })).toThrow('select requires a selector');
  });

  it('requires a value', () => {
    expect(() => selectCommand.parseShorthand({ rest: '#c' })).toThrow('select requires a value');
  });
});

describe('select schema', () => {
  it('accepts several values', () => {
    expect(selectCommand.schema.safeParse({ action: 'select', selector: '#c', values: ['a', 'b'] }).success).toBe(true);
  });

  it('rejects an empty values list', () => {
    expect(selectCommand.schema.safeParse({ action: 'select', selector: '#c', values: [] }).success).toBe(false);
  });
});

describe('select execute', () => {
  it('spreads values into page.select', async () => {
    const { page, asPage } = fakePage();
    await selectCommand.execute(asPage, { action: 'select', selector: { type: 'css', value: '#c' }, values: ['a', 'b'] });
    expect(page.select).toHaveBeenCalledWith('#c', 'a', 'b');
  });
});
