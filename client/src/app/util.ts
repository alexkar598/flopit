export function notNull<T>(val?: T | null | undefined): val is T {
  return val != null;
}

export function throwException(exception: unknown): never {
  throw exception;
}

export function isFragment<Fragment extends { __typename?: string }>(
  typename: Fragment["__typename"],
): (value: unknown) => value is Fragment {
  return (value): value is Fragment =>
    typeof value === "object" && (value as any)?.__typename === typename;
}
