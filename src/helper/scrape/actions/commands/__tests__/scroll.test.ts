import { describe, expect, it, vi } from 'vitest';
import { scrollCommand } from '../scroll';
import { describeSelectorOnlyCommand } from './selector-only';
import { fakePage } from '../../__mocks__/fake-page';

describeSelectorOnlyCommand(scrollCommand);

describe('scroll execute', () => {
  it('scrolls the element into view via $eval', async () => {
    const { page, asPage } = fakePage();
    await scrollCommand.execute(asPage, { action: 'scroll', selector: { type: 'css', value: '#foot' } });
    expect(page.$eval).toHaveBeenCalledWith('#foot', expect.any(Function));
  });

  it('centres the element instantly', async () => {
    const { page, asPage } = fakePage();
    await scrollCommand.execute(asPage, { action: 'scroll', selector: { type: 'css', value: '#foot' } });
    const fn = page.$eval.mock.calls[0][1] as (el: Element) => void;
    const scrollIntoView = vi.fn();
    fn({ scrollIntoView } as unknown as Element);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'center' });
  });
});
