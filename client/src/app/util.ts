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
