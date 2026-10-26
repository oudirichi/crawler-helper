import { describe, expect, it } from 'vitest';
import { typeCommand } from '../type';
import { fakePage } from '../../__mocks__/fake-page';

describe('type shorthand', () => {
  it('splits selector and text, keeping spaces in the text', () => {
    expect(typeCommand.parseShorthand({ rest: '#q hello big world' })).toEqual({
      action: 'type',
      selector: '#q',
      text: 'hello big world',
    });
  });

  it('parses the modifier as delay', () => {
    expect(typeCommand.parseShorthand({ modifier: '120', rest: '#q hi' })).toEqual({
      action: 'type',
      selector: '#q',
      text: 'hi',
      delay: 120,
    });
  });

  it('requires a selector', () => {
    expect(() => typeCommand.parseShorthand({ rest: '' })).toThrow('type requires a selector');
  });

  it('requires text', () => {
    expect(() => typeCommand.parseShorthand({ rest: '#q' })).toThrow('type requires text');
  });

  it('rejects a non-numeric delay', () => {
    expect(() => typeCommand.parseShorthand({ modifier: 'fast', rest: '#q hi' })).toThrow('type delay must be a number');
  });
});

describe('type schema', () => {
  it('requires text', () => {
    expect(typeCommand.schema.safeParse({ action: 'type', selector: '#q' }).success).toBe(false);
  });

  it('accepts empty text', () => {
    expect(typeCommand.schema.safeParse({ action: 'type', selector: '#q', text: '' }).success).toBe(true);
  });
});

describe('type execute', () => {
  it('types text with the given delay', async () => {
    const { page, asPage } = fakePage();
    await typeCommand.execute(asPage, { action: 'type', selector: { type: 'css', value: '#q' }, text: 'hi', delay: 5 });
    expect(page.type).toHaveBeenCalledWith('#q', 'hi', { delay: 5 });
  });
});
