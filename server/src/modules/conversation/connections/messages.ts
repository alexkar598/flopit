import { builder } from "../../../builder.ts";
import { resolveCursorConnection } from "@pothos/plugin-relay";
import { Message, MessageConnection } from "../../message/schema.ts";
import { getConversationId } from "../util.ts";
import { redis } from "../../../redis.ts";

builder.prismaObjectField("Conversation", "messages", (t) =>
  t.field({
    type: MessageConnection,
    args: t.arg.connectionArgs(),
    // @ts-ignore
    resolve: (parent, args) => {
      return resolveCursorConnection(
        { args, toCursor: (value) => (value as Message).id },
        async ({ limit, before, after, inverted }) => {
          const conversationId = getConversationId(
            parent.owner_id,
            parent.target_id,
          );

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

          return redisMessages.map((msg) => ({
            id: msg.id,
            ...msg.message,
          })) as Message[];
        },
      );
    },
  }),
);
