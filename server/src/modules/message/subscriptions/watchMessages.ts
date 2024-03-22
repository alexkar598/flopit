import { builder } from "../../../builder";
import { Message, messageRef } from "../schema.ts";
import { userRef } from "../../user/schema.ts";
import { createRedisClient } from "../../../redis.ts";
import { getConversationId } from "../util.ts";
import { getAPIError } from "../../../util.ts";

builder.subscriptionField("watchMessages", (t) =>
  t.field({
    type: messageRef,
    args: {
      target: t.arg.globalID({ for: userRef }),
      max: t.arg.int({ required: false }),
    },
    subscribe: async function* (_, { target, max }, { authenticated_user_id }) {
      if (!authenticated_user_id) throw getAPIError("AUTHENTICATED_FIELD");

      const conversationId = getConversationId(
        authenticated_user_id,
        target.id,
      );

      let nextId = "$";

      const redis = await createRedisClient();

      for (let i = 0; i < (max ?? Number.POSITIVE_INFINITY); i++) {
        while (true) {
          const redisMessage = await redis.xRead(
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
      void redis.disconnect();
    },
    resolve: (payload) => payload,
  }),
);
