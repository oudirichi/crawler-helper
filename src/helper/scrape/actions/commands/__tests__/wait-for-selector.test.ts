import { describe, expect, it } from 'vitest';
import { waitForSelectorCommand } from '../wait-for-selector';
import { fakePage } from '../../__mocks__/fake-page';

describe('waitForSelector shorthand', () => {
  it('parses a selector', () => {
    expect(waitForSelectorCommand.parseShorthand({ rest: '.ready' })).toEqual({
      action: 'waitForSelector',
      selector: '.ready',
    });
  });

  it('parses the modifier as timeout', () => {
    expect(waitForSelectorCommand.parseShorthand({ modifier: '5000', rest: '.ready' })).toEqual({
      action: 'waitForSelector',
      selector: '.ready',
      timeout: 5000,
    });
  });

  it('requires a selector', () => {
    expect(() => waitForSelectorCommand.parseShorthand({ rest: '' })).toThrow('waitForSelector requires a selector');
  });

  it('rejects a non-numeric timeout', () => {
    expect(() => waitForSelectorCommand.parseShorthand({ modifier: 'soon', rest: '.r' })).toThrow(
      'waitForSelector timeout must be a number',
    );
  });
});

describe('waitForSelector schema', () => {
  it('accepts the "attached" state', () => {
    const r = waitForSelectorCommand.schema.safeParse({
      action: 'waitForSelector',
      selector: { type: 'css', value: '.r', state: 'attached' },
    });
    expect(r.success).toBe(true);
  });

  it('rejects unsupported states', () => {
    const r = waitForSelectorCommand.schema.safeParse({
      action: 'waitForSelector',
      selector: { type: 'css', value: '.r', state: 'visible' },
    });
    expect(r.success).toBe(false);
  });

  it('rejects xpath selectors', () => {
    const r = waitForSelectorCommand.schema.safeParse({
      action: 'waitForSelector',
      selector: { type: 'xpath', value: '//a' },
    });
    expect(r.success).toBe(false);
  });
});

describe('waitForSelector execute', () => {
  it('defaults the timeout to 30s', async () => {
    const { page, asPage } = fakePage();
    await waitForSelectorCommand.execute(asPage, { action: 'waitForSelector', selector: { type: 'css', value: '.r' } });
    expect(page.waitForSelector).toHaveBeenCalledWith('.r', { timeout: 30_000 });
  });

  it('uses the given timeout', async () => {
    const { page, asPage } = fakePage();
    await waitForSelectorCommand.execute(asPage, {
      action: 'waitForSelector',
      selector: { type: 'css', value: '.r' },
      timeout: 1000,
    });
    expect(page.waitForSelector).toHaveBeenCalledWith('.r', { timeout: 1000 });
  });
});
