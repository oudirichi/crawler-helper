import { describe, expect, it } from 'vitest';
import { parseActionString, runActions, validateActions } from '../index';
import { fakePage } from '../__mocks__/fake-page';

const css = (value: string) => ({ type: 'css' as const, value });

describe('parseActionString', () => {
  it('parses a bare verb with a selector', () => {
    expect(parseActionString('click #go')).toEqual({ action: 'click', selector: '#go' });
  });

  it('splits the ":modifier" off the verb', () => {
    expect(parseActionString('type:120 #q hello world')).toEqual({
      action: 'type',
      selector: '#q',
      text: 'hello world',
      delay: 120,
    });
  });

  it('tolerates surrounding and repeated whitespace', () => {
    expect(parseActionString('  hover    #menu  ')).toEqual({ action: 'hover', selector: '#menu' });
  });

  it('handles a verb with no tail', () => {
    expect(() => parseActionString('click')).toThrow('click requires a selector');
  });

  it('rejects an empty string', () => {
    expect(() => parseActionString('   ')).toThrow('empty action string');
  });

  it('rejects an unknown verb', () => {
    expect(() => parseActionString('teleport #x')).toThrow('unknown action "teleport"');
  });
});

describe('validateActions', () => {
  it('accepts object and string forms together', () => {
    const result = validateActions([{ action: 'hover', selector: css('#a') }, 'click #b']);
    expect(result).toEqual([
      { action: 'hover', selector: css('#a') },
      { action: 'click', selector: css('#b') },
    ]);
  });

  it('prefixes shorthand errors with the action index', () => {
    expect(() => validateActions(['click #a', 'teleport #b'])).toThrow('actions[1]: unknown action "teleport"');
  });

  it('reports schema issues with their path', () => {
    expect(() => validateActions([{ action: 'type', selector: css('#a') } as never])).toThrow(/^actions\[0\]\.text/);
  });

  it('joins several issues with "; "', () => {
    expect(() =>
      validateActions([{ action: 'type' } as never, { action: 'select', selector: '#s', values: [] } as never]),
    ).toThrow(/actions\[0\].*; actions\[1\]/);
  });

  it('returns an empty list for no actions', () => {
    expect(validateActions([])).toEqual([]);
  });
});

describe('runActions', () => {
  it('executes actions in order', async () => {
    const { page, asPage } = fakePage();
    await runActions(asPage, validateActions(['hover #a', 'click #b']));
    expect(page.hover).toHaveBeenCalledWith('#a');
    expect(page.click).toHaveBeenCalledWith('#b', { button: 'left', delay: undefined });
    expect(page.hover.mock.invocationCallOrder[0]).toBeLessThan(page.click.mock.invocationCallOrder[0]);
  });

  it('fails fast, wrapping the error with index and verb', async () => {
    const { page, asPage } = fakePage();
    const cause = new Error('boom');
    page.click.mockRejectedValueOnce(cause);
    const actions = validateActions(['click #a', 'hover #b']);

    const error = await runActions(asPage, actions).catch((e: Error) => e);

    expect(error).toMatchObject({ message: 'action[0] click: boom', cause });
    expect(page.hover).not.toHaveBeenCalled();
  });

  it('reports an action with no registered command', async () => {
    const { asPage } = fakePage();
    await expect(runActions(asPage, [{ action: 'teleport' } as never])).rejects.toThrow(
      'action[0] teleport: no command registered for "teleport"',
    );
  });
});
