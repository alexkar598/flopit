import { GraphQLError } from "graphql/error";
import { Writable } from "node:stream";
import crypto from "node:crypto";
import { APIError, ErrorCode } from "~shared/apierror.ts";

export function capitalizeFirst(input: string) {
  if (input.length <= 1) {
    return input.toUpperCase();
  }

  return input[0].toUpperCase() + input.substring(1);
}

export function getAPIError(
  code: ErrorCode,
  submessage?: string,
): GraphQLError {
  let message = APIError[code];
  if (submessage != null) message += `: ${submessage}`;
  return new GraphQLError(message, {
    extensions: {
      code,
    },
  });
}

export async function pauseWrite(stream: Writable, chunk: any) {
  const should_wait = !stream.write(chunk);
  if (should_wait)
    return new Promise((resolve) => stream.once("drain", resolve));
}

export function throwException(exception: any): never {
  throw exception;
}

export interface ImageTransformations {
  width?: Number;
  height?: Number;
  resizeMode?: "fill" | "fit" | "fill-down" | "auto" | "force";
  gravity?: "sm";
}

const imgproxy_key = Buffer.from(process.env.IMGPROXY_KEY!, "hex");
const imgproxy_salt = Buffer.from(process.env.IMGPROXY_SALT!, "hex");

export function getImg<OID extends string | null>(
  oid: OID,
  transformations: ImageTransformations = {},
  bucket = "images",
): OID | string {
  if (oid === null) return oid;

  const base64url = btoa("s3://" + bucket + "/" + oid);
  const trans = Object.assign(
    { width: 0, height: 0, resizeMode: "auto", gravity: "sm" },
    transformations,
  );
  const unsigned_url = `/rs:${trans.resizeMode}:${trans.width}:${trans.height}:0/g:${trans.gravity}/${base64url}`;
  const hmac = crypto
    .createHmac("sha256", imgproxy_key)
    .update(imgproxy_salt)
    .update(unsigned_url)
    .digest()
    .toString("base64url");
  return "/image/" + hmac + unsigned_url;
}
