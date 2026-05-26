export function unsupportedValueError(
  path: string,
  value: unknown,
  supported: readonly string[],
): Error {
  return new Error(
    `${path}: unsupported value "${String(value)}" (supported: ${supported.join(', ')})`,
  );
}
