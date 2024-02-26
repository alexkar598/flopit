export function notNull<T>(x: T | null | undefined): x is T {
  return x != null;
}

export interface ImageTransformations {
  width?: Number;
  height?: Number;
  resizeMode?: "fill" | "fit" | "fill-down" | "auto" | "force";
  gravity?: "sm";
}

export function getImgUrl(
  oid: string,
  transformations: ImageTransformations = {},
  bucket = "images",
) {
  const base64url = btoa("s3://" + bucket + "/" + oid);
  const trans = Object.assign(
    { width: 0, height: 0, resizeMode: "auto", gravity: "sm" },
    transformations,
  );
  return `/image/_/rs:${trans.resizeMode}:${trans.width}:${trans.height}:0/g:${trans.gravity}/${base64url}`;
}
