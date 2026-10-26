import { describe, expect, it } from 'vitest';
import { clickCommand } from '../click';
import { fakePage } from '../../__mocks__/fake-page';

describe('click shorthand', () => {
  it('parses a selector', () => {
    expect(clickCommand.parseShorthand({ rest: '#go' })).toEqual({ action: 'click', selector: '#go' });
  });

  it('parses the modifier as delay', () => {
    expect(clickCommand.parseShorthand({ modifier: '50', rest: '#go' })).toEqual({
      action: 'click',
      selector: '#go',
      delay: 50,
    });
  });

  it('requires a selector', () => {
    expect(() => clickCommand.parseShorthand({ rest: '' })).toThrow('click requires a selector');
  });

  it('rejects a non-numeric delay', () => {
    expect(() => clickCommand.parseShorthand({ modifier: 'x', rest: '#go' })).toThrow('click delay must be a number');
  });
});

describe('click schema', () => {
  it('accepts button and delay', () => {
    const r = clickCommand.schema.safeParse({ action: 'click', selector: '#a', button: 'right', delay: 10 });
    expect(r.success).toBe(true);
  });

  it('rejects an unknown button', () => {
    expect(clickCommand.schema.safeParse({ action: 'click', selector: '#a', button: 'back' }).success).toBe(false);
  });
});

describe('click execute', () => {
  it('defaults to the left button', async () => {
    const { page, asPage } = fakePage();
    await clickCommand.execute(asPage, { action: 'click', selector: { type: 'css', value: '#a' } });
    expect(page.click).toHaveBeenCalledWith('#a', { button: 'left', delay: undefined });
  });

  it('forwards button and delay', async () => {
    const { page, asPage } = fakePage();
    await clickCommand.execute(asPage, {
      action: 'click',
      selector: { type: 'css', value: '#a' },
      button: 'middle',
      delay: 25,
    });
    expect(page.click).toHaveBeenCalledWith('#a', { button: 'middle', delay: 25 });
  });
});
