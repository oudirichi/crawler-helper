import { describe, expect, it } from 'vitest';
import { ActionSchema, COMMANDS, commandFor } from '../registry';

describe('COMMANDS', () => {
  it('has unique names', () => {
    const names = COMMANDS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('registers every documented action', () => {
    expect(COMMANDS.map((c) => c.name).sort()).toEqual(
      ['click', 'hover', 'scroll', 'select', 'type', 'waitForSelector', 'waitForTimeout'],
    );
  });
});

describe('commandFor', () => {
  it.each(COMMANDS.map((c) => c.name))('returns the %s command', (name) => {
    expect(commandFor(name)?.name).toBe(name);
  });

  it('returns undefined for an unknown verb', () => {
    expect(commandFor('teleport')).toBeUndefined();
  });
});

describe('ActionSchema', () => {
  it('dispatches on the action discriminator', () => {
    const r = ActionSchema.safeParse({ action: 'click', selector: '#a' });
    expect(r.success && r.data).toEqual({ action: 'click', selector: { type: 'css', value: '#a' } });
  });

  it('rejects an unknown action', () => {
    expect(ActionSchema.safeParse({ action: 'teleport' }).success).toBe(false);
  });

  it('applies the matching command schema', () => {
    expect(ActionSchema.safeParse({ action: 'type', selector: '#a' }).success).toBe(false);
  });
});
