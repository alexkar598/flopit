export function notNull<T>(val?: T | null | undefined): val is T {
  return val != null;
}

export function truthy<T>(val?: T | "" | null | undefined | false): val is T {
  return Boolean(val);
}

export function throwException(exception: unknown): never {
  throw exception;
}

export function isFragment<Fragment extends { __typename?: string }>(
  typenames: Fragment["__typename"] | Fragment["__typename"][],
): (value: unknown) => value is Fragment {
  return (value): value is Fragment => {
    if (value == null) return false;
    if (typeof value !== "object") return false;
    if (!Array.isArray(typenames)) typenames = [typenames];
    const __typename = (value as any).__typename;
    if (!typenames.some((typename) => __typename === typename)) {
      throw new Error("Type inconnu: " + __typename);
    }
    return true;
  };
}
