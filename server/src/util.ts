import { GraphQLError } from "graphql/error";
import { Writable } from "node:stream";
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
