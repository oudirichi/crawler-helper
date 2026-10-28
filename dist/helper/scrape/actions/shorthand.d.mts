import type { ShorthandParts } from './command';
/** Parse a shorthand numeric field, throwing a labelled error on non-numbers. */
export declare function toNumber(label: string, raw: string): number;
/** Split a shorthand tail into a leading selector token + the remaining payload. */
export declare function splitSelectorPayload(rest: string): {
    selector: string;
    payload: string;
};
/** Shorthand parser shared by selector-only actions (no `:` modifier allowed). */
export declare function parseSelectorOnly(name: string, { modifier, rest }: ShorthandParts): unknown;
