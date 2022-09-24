export function assertNonNull<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new Error("Unexpected null value");
  }
  return value;
}

export function first<T>(array: readonly T[]): T | undefined {
  return array[0];
}
