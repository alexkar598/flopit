import base from "base-x";
import { GraphQLError } from "graphql/error";
import { Writable } from "node:stream";
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
