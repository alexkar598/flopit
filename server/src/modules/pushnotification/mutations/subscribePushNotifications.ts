import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import webpush from "web-push";
import { getAPIError } from "../../../util.ts";

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
    resolve: async (query, _root, { input }, { authenticated_user_id }) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: input.endpoint,
            keys: {
              p256dh: Buffer.from(input.p256dh, "hex").toString("base64"),
              auth: Buffer.from(input.auth, "hex").toString("base64"),
            },
          },
          JSON.stringify({
            notification: {
              title: "FlopIt!",
              body: "Les notifications ont été activées avec succès!",
              icon: `${process.env.PUBLIC_URL!}/assets/FlopIt.svg`,
            },
          }),
        );
      } catch (e) {
        throw getAPIError("PUSH_NOTIFICATION_INVALID", e?.toString());
      }

      return prisma.pushNotification.create({
        ...query,
        data: {
          user_id: authenticated_user_id,
          endpoint: input.endpoint,
          expiration_time: input.expirationTime,
          p256dh: Buffer.from(input.p256dh, "hex"),
          auth: Buffer.from(input.auth, "hex"),
        },
      });
    },
  }),
);
