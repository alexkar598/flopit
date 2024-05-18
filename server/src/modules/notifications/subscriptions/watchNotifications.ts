import { builder } from "../../../builder";
import { Notification, notificationRef } from "../schema.ts";
import { createRedisClient } from "../../../redis.ts";

builder.subscriptionField("watchNotifications", (t) =>
  t.withAuth({ authenticated: true }).field({
    type: notificationRef,
    args: {
      max: t.arg.int({ required: false }),
      after: t.arg.string({ required: false }),
    },
    subscribe: async function* (_, { max, after }, { authenticated_user_id }) {
      let nextId = after || "$";

      const redis = await createRedisClient();

      try {
        for (let i = 0; i < (max ?? Number.POSITIVE_INFINITY); i++) {
          const redisMessage = await redis.xRead(
            { key: `notif:${authenticated_user_id}`, id: nextId },
            {
              BLOCK: 0,
              COUNT: 1,
            },
          );

          if (redisMessage == null) {
            i--;
            continue;
          }

          nextId = redisMessage[0].messages[0].id;

          yield {
            id: redisMessage[0].messages[0].id,
            ...redisMessage[0].messages[0].message,
          } as Notification;
        }
      } finally {
        void redis.disconnect();
      }
    },
    resolve: (payload) => payload,
  }),
);
