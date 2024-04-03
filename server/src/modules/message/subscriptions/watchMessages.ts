import { builder } from "../../../builder";
import { Message, messageRef } from "../schema.ts";
import { userRef } from "../../user/schema.ts";
import { getAPIError } from "../../../util.ts";
import { getConversationId } from "../../conversation/util.ts";
import { redis } from "../../../redis.ts";
import { commandOptions } from "redis";

builder.subscriptionField("watchMessages", (t) =>
  t.field({
    type: messageRef,
    args: {
      target: t.arg.globalID({ for: userRef }),
      max: t.arg.int({ required: false }),
      after: t.arg.string({ required: false }),
    },
    subscribe: async function* (
      _,
      { target, max, after },
      { authenticated_user_id },
    ) {
      if (!authenticated_user_id) throw getAPIError("AUTHENTICATED_FIELD");

      const conversationId = getConversationId(
        authenticated_user_id,
        target.id,
      );

      let nextId = after ?? "$";

      for (let i = 0; i < (max ?? Number.POSITIVE_INFINITY); i++) {
        while (true) {
          const redisMessage = await redis.xRead(
            commandOptions({ isolated: true }),
            { key: conversationId, id: nextId },
            {
              BLOCK: 60 * 1000,
              COUNT: 1,
            },
          );

          if (redisMessage == null) continue;

          nextId = redisMessage[0].messages[0].id;

          yield {
            id: redisMessage[0].messages[0].id,
            ...redisMessage[0].messages[0].message,
          } as Message;
          break;
        }
      }
    },
    resolve: (payload) => payload,
  }),
);
