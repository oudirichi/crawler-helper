import type { ShorthandParts } from './command';

/** Parse a shorthand numeric field, throwing a labelled error on non-numbers. */
export function toNumber(label: string, raw: string): number {
  const n = Number(raw);
  if (raw.trim() === '' || !Number.isFinite(n)) {
    throw new Error(`${label} must be a number, got "${raw}"`);
  }
  return n;
}

/** Split a shorthand tail into a leading selector token + the remaining payload. */
export function splitSelectorPayload(rest: string): { selector: string; payload: string } {
  const m = rest.match(/^(\S+)(?:\s+([\s\S]*))?$/);
  if (!m) return { selector: '', payload: '' };
  return { selector: m[1], payload: (m[2] ?? '').trim() };
}

/** Shorthand parser shared by selector-only actions (no `:` modifier allowed). */
export function parseSelectorOnly(name: string, { modifier, rest }: ShorthandParts): unknown {
  if (modifier !== undefined) throw new Error(`${name} takes no ":" modifier`);
  if (!rest) throw new Error(`${name} requires a selector`);
  return { action: name, selector: rest };
}
