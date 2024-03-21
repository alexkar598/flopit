export interface ImageTransformations {
  width?: Number;
  height?: Number;
  resizeMode?: "fill" | "fit" | "fill-down" | "auto" | "force";
  gravity?: "sm";
}

export function getImg(
  oid: string,
  transformations: ImageTransformations = {},
  bucket = "images",
): string {
  const base64url = btoa("s3://" + bucket + "/" + oid);
  const trans = Object.assign(
    { width: 0, height: 0, resizeMode: "auto", gravity: "sm" },
    transformations,
  );
  return `/image/_/rs:${trans.resizeMode}:${trans.width}:${trans.height}:0/g:${trans.gravity}/${base64url}`;
}

export function notNull<T>(val?: T | null | undefined): val is T {
  return val != null;
}

export function throwException(exception: unknown): never {
  throw exception;
}

export type DebouncedFunction<
  T extends (...args: Parameters<T>) => ReturnType<T>,
> = (...args: Parameters<T>) => Promise<ReturnType<T>>;

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  duration: number,
): DebouncedFunction<T> {
  let lastCallTime = 0;
  let timer: unknown = null;

  function invoke(
    args: Parameters<T>,
    time: number = new Date().getTime(),
  ): ReturnType<T> {
    lastCallTime = time;
    timer = null;
    return callback(...args);
  }

  return function (...args: Parameters<T>): Promise<ReturnType<T>> {
    const now = new Date().getTime();
    const timeUntilCall = lastCallTime + duration - now;

    return new Promise<ReturnType<T>>((resolve) => {
      if (timeUntilCall <= 0) resolve(invoke(args, now));
      else if (timer === null)
        timer = setTimeout(() => resolve(invoke(args)), timeUntilCall);
    });
  };
}
