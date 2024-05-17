import { builder } from "../../../builder.ts";
import {
  resolveCursorConnection,
  ResolveCursorConnectionArgs,
} from "@pothos/plugin-relay";
import {
  Notification,
  NotificationConnection,
} from "../../notifications/schema.ts";
import { redis } from "../../../redis.ts";

builder.prismaObjectField("User", "notifications", (t) =>
  t.withAuth({ authenticated: true }).field({
    type: NotificationConnection,
    args: t.arg.connectionArgs(),
    authScopes: { $granted: "self" },
    resolve: (parent, args) => {
      return resolveCursorConnection(
        { args, toCursor: (value) => (value as Notification).id },
        async ({
          limit,
          before,
          after,
          inverted,
        }: ResolveCursorConnectionArgs) => {
          const method = (inverted ? redis.xRevRange : redis.xRange).bind(
            redis,
          );

          const afterBefore = [after ?? "-", before ?? "+"];
          if (inverted) afterBefore.reverse();

          const redisMessages = await method(
            `notif:${parent.id}`,
            afterBefore[0],
            afterBefore[1],
            {
              COUNT: limit,
            },
          );

          return redisMessages.map((msg) => ({
            id: msg.id,
            ...msg.message,
          })) as Notification[];
        },
      );
    },
  }),
);
