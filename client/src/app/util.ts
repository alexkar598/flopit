export function notNull<T>(val?: T | null | undefined): val is T {
  return val != null;
}

export function throwException(exception: unknown): never {
  throw exception;
}
