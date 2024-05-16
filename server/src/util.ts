import base from "base-x";
import { GraphQLError } from "graphql/error";
import { Writable } from "node:stream";
import crypto from "node:crypto";
import { APIError, ErrorCode } from "~shared/apierror.ts";

export const base62 = base(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
);

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

export enum SlugType {
  Attachment,
  TopPost,
  Comment,
  PushNotification,
  Session,
  Sub,
  User,
  Conversation,
}
export function slugify(type: SlugType, uuid: string) {
  //IDs composite
  if (type === SlugType.Attachment) {
    const [id, order] = JSON.parse(uuid);

    const buffer = Buffer.allocUnsafe(18);
    buffer.writeUint8(type, 0);
    buffer.writeUint8(order, 1);
    buffer.write(id.replaceAll("-", ""), 2, "hex");
    return base62.encode(buffer);
  } else if (type === SlugType.Conversation) {
    const [id1, id2] = JSON.parse(uuid);

    const buffer = Buffer.allocUnsafe(33);
    buffer.writeUint8(type, 0);
    buffer.write(id1.replaceAll("-", ""), 1, "hex");
    buffer.write(id2.replaceAll("-", ""), 17, "hex");
    return base62.encode(buffer);
  }
  const buffer = Buffer.allocUnsafe(17);
  buffer.writeUint8(type, 0);
  buffer.write(uuid.replaceAll("-", ""), 1, "hex");
  return base62.encode(buffer);
}

export function format_uuid(hex_string: string): string {
  return `${hex_string.slice(0, 8)}-${hex_string.slice(8, 12)}-${hex_string.slice(12, 16)}-${hex_string.slice(16, 20)}-${hex_string.slice(20)}`;
}

export function unslugify(slug: string) {
  try {
    const buffer = Buffer.from(base62.decode(slug));
    const type = buffer.readUint8(0);
    const typeName = SlugType[type];
    if (typeName == undefined) {
      // noinspection ExceptionCaughtLocallyJS
      throw getAPIError("INVALID_ID", "Type invalide");
    }

    if (type == SlugType.Attachment) {
      const order = buffer.readUint8(1);
      const uuid = buffer.subarray(2).toString("hex");
      if (uuid.length !== 32) {
        // noinspection ExceptionCaughtLocallyJS
        throw getAPIError("INVALID_ID", "UUID de mauvaise grandeur");
      }

      return {
        typename: typeName,
        id: JSON.stringify([format_uuid(uuid), order]),
      };
    } else if (type === SlugType.Conversation) {
      const id1 = buffer.subarray(1, 17).toString("hex");
      if (id1.length !== 32) {
        // noinspection ExceptionCaughtLocallyJS
        throw getAPIError("INVALID_ID", "id1 de mauvaise grandeur");
      }
      const id2 = buffer.subarray(17).toString("hex");
      if (id2.length !== 32) {
        // noinspection ExceptionCaughtLocallyJS
        throw getAPIError("INVALID_ID", "id2 de mauvaise grandeur");
      }

      return {
        typename: typeName,
        id: JSON.stringify([format_uuid(id1), format_uuid(id2)]),
      };
    }

    const uuid = buffer.subarray(1).toString("hex");
    if (uuid.length !== 32) {
      // noinspection ExceptionCaughtLocallyJS
      throw getAPIError("INVALID_ID", "UUID de mauvaise grandeur");
    }

    return {
      typename: typeName,
      id: format_uuid(uuid),
    };
  } catch (e) {
    if (e instanceof GraphQLError) throw e;
    console.error("ID invalide:", slug, e);
    throw getAPIError("INVALID_ID");
  }
}

export interface ImageTransformations {
  width?: Number;
  height?: Number;
  resizeMode?: "fill" | "fit" | "fill-down" | "auto" | "force";
  gravity?: "sm" | "ce";
  format?:
    | "png"
    | "jpg"
    | "jpeg"
    | "webp"
    | "avif"
    | "gif"
    | "ico"
    | "heic"
    | "bmp"
    | "tiff";
}

const imgproxy_url = process.env.IMGPROXY_URL!;
const imgproxy_key = Buffer.from(process.env.IMGPROXY_KEY!, "hex");
const imgproxy_salt = Buffer.from(process.env.IMGPROXY_SALT!, "hex");

function signImgproxy(unsigned_url: string): string {
  return crypto
    .createHmac("sha256", imgproxy_key)
    .update(imgproxy_salt)
    .update(unsigned_url)
    .digest()
    .toString("base64url");
}

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
  let unsigned_url = `/rs:${trans.resizeMode}:${trans.width}:${trans.height}:0/g:${trans.gravity}/${base64url}`;
  if (trans.format) unsigned_url += `.${trans.format}`;

  return "/image/" + signImgproxy(unsigned_url) + unsigned_url;
}

interface ImageSize {
  width: number;
  height: number;
}

export async function getImgSize(imgUrl: string): Promise<ImageSize | null> {
  const url = new URL(imgUrl, imgproxy_url);

  try {
    let res = await fetch(url);
    return {
      width: parseInt(res.headers.get("X-Result-Width")!),
      height: parseInt(res.headers.get("X-Result-Height")!),
    };
  } catch {
    return null;
  }
}
