import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";

const input = builder.inputType("SubscribePushNotifications", {
  fields: (t) => ({
    endpoint: t.string(),
    expirationTime: t.field({ type: "DateTime", required: false }),
    auth: t.string(),
    p256dh: t.string(),
  }),
});

builder.mutationField("subscribePushNotifications", (t) =>
  t.withAuth({ authenticated: true }).prismaField({
    type: "PushNotification",
    nullable: true,
    args: { input: t.arg({ type: input }) },
    grantScopes: ["self"],
    resolve: (query, _root, { input }, { authenticated_user_id }) =>
      prisma.pushNotification.create({
        ...query,
        data: {
          user_id: authenticated_user_id,
          endpoint: input.endpoint,
          expiration_time: input.expirationTime,
          p256dh: Buffer.from(input.p256dh, "hex"),
          auth: Buffer.from(input.auth, "hex"),
        },
      }),
  }),
);
