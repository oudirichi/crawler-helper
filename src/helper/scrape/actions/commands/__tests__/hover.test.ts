import { describe, expect, it } from 'vitest';
import { hoverCommand } from '../hover';
import { describeSelectorOnlyCommand } from './selector-only';
import { fakePage } from '../../__mocks__/fake-page';

describeSelectorOnlyCommand(hoverCommand);

describe('hover execute', () => {
  it('hovers the selector', async () => {
    const { page, asPage } = fakePage();
    await hoverCommand.execute(asPage, { action: 'hover', selector: { type: 'css', value: '#m' } });
    expect(page.hover).toHaveBeenCalledWith('#m');
  });
});
