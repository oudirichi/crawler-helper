import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForTimeoutCommand } from '../wait-for-timeout';
import { sleep } from '../../../../sleep';
import { fakePage } from '../../__mocks__/fake-page';

vi.mock('../../../../sleep', () => ({ sleep: vi.fn().mockResolvedValue(undefined) }));

beforeEach(() => vi.mocked(sleep).mockClear());

describe('waitForTimeout shorthand', () => {
  it('parses the modifier form', () => {
    expect(waitForTimeoutCommand.parseShorthand({ modifier: '2', rest: '' })).toEqual({
      action: 'waitForTimeout',
      timeout: 2,
    });
  });

  it('parses the positional form', () => {
    expect(waitForTimeoutCommand.parseShorthand({ rest: '1.5' })).toEqual({
      action: 'waitForTimeout',
      timeout: 1.5,
    });
  });

  it('requires a number', () => {
    expect(() => waitForTimeoutCommand.parseShorthand({ rest: '' })).toThrow('waitForTimeout requires a number');
  });

  it('rejects a non-numeric value', () => {
    expect(() => waitForTimeoutCommand.parseShorthand({ rest: 'abc' })).toThrow('waitForTimeout must be a number');
  });
});

describe('waitForTimeout schema', () => {
  it('requires a numeric timeout', () => {
    expect(waitForTimeoutCommand.schema.safeParse({ action: 'waitForTimeout' }).success).toBe(false);
    expect(waitForTimeoutCommand.schema.safeParse({ action: 'waitForTimeout', timeout: '1' }).success).toBe(false);
  });
});

describe('waitForTimeout execute', () => {
  it('sleeps for the timeout converted from seconds to milliseconds', async () => {
    const { asPage } = fakePage();
    await waitForTimeoutCommand.execute(asPage, { action: 'waitForTimeout', timeout: 2 });
    expect(sleep).toHaveBeenCalledWith(2000);
  });
});
