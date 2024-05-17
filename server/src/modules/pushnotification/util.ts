import { prisma } from "../../db.ts";
import webpush from "web-push";
import { builder } from "../../builder.ts";

webpush.setVapidDetails(
  "https://localhost", //process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function notifyUser(userId: string, message: string) {
  const pushNotifications = await prisma.pushNotification.findMany({
    where: { user_id: userId },
  });

  return Promise.allSettled(
    pushNotifications.map((pushNotification) => {
      webpush.sendNotification(
        {
          endpoint: pushNotification.endpoint,
          keys: {
            p256dh: pushNotification.p256dh.toString("base64"),
            auth: pushNotification.auth.toString("base64"),
          },
        },
        message,
      );
    }),
  );
}

builder.mutationField("testnotif", (t) =>
  t.withAuth({ authenticated: true }).field({
    type: "JSON",
    args: {
      message: t.arg.string(),
    },
    nullable: true,
    resolve: async (_, { message }, { authenticated_user_id }) => {
      return console.log(await notifyUser(authenticated_user_id, message));
    },
  }),
);
