import { builder } from "../../builder";
import { Message, messageRef } from "./schema.ts";
import { createRedisClient } from "../../redis.ts";
import { userRef } from "../user/schema.ts";
import { getConversationId } from "./util.ts";
import { getAPIError } from "../../util.ts";
import { resolveCursorConnection } from "@pothos/plugin-relay";

const MessageConnection = builder.connectionObject({
  type: messageRef,
  name: "MessageConnection",
});

builder.queryField("messages", (t) =>
  t.field({
    type: MessageConnection,
    args: {
      ...t.arg.connectionArgs(),
      target: t.arg.globalID({ for: userRef }),
    },
    resolve: (_parent, args, { authenticated_user_id }) => {
      if (!authenticated_user_id) throw getAPIError("AUTHENTICATED_FIELD");

      return resolveCursorConnection(
        { args, toCursor: (value) => (value as Message).id },
        async ({ limit, before, after, inverted }) => {
          const conversationId = getConversationId(
            authenticated_user_id,
            args.target.id,
          );

          const redis = await createRedisClient();

          const method = (inverted ? redis.xRevRange : redis.xRange).bind(
            redis,
          );

          const afterBefore = [after ?? "-", before ?? "+"];
          if (inverted) afterBefore.reverse();

          const redisMessages = await method(
            conversationId,
            afterBefore[0],
            afterBefore[1],
            {
              COUNT: limit,
            },
          );

          void redis.disconnect();

          return redisMessages.map((msg) => ({
            id: msg.id,
            ...msg.message,
          })) as Message[];
        },
      );
    },
  }),
);
