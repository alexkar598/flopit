import { prisma } from "../../db.ts";
import webpush from "web-push";
import { redis } from "../../redis.ts";
import { Notification } from "./schema.ts";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export function notifyUser(userId: string, message: string, url?: string) {
  void (async function () {
    const pushNotifications = await prisma.pushNotification.findMany({
      where: { user_id: userId },
    });

    const notification: Omit<Notification, "id"> = {
      message: message,
      ...(url && { url }),
    };

    await redis.xAdd(`notif:${userId}`, "*", notification);

    return Promise.allSettled(
      pushNotifications.map((pushNotification) => {
        webpush
          .sendNotification(
            {
              endpoint: pushNotification.endpoint,
              keys: {
                p256dh: pushNotification.p256dh.toString("base64"),
                auth: pushNotification.auth.toString("base64"),
              },
            },
            JSON.stringify({
              notification: {
                title: "FlopIt!",
                body: message,
                icon: `${process.env.PUBLIC_URL!}/assets/FlopIt.svg`,
                ...(url && {
                  data: {
                    onActionClick: {
                      default: {
                        operation: "navigateLastFocusedOrOpen",
                        url: `${process.env.PUBLIC_URL!}/${url}`,
                      },
                    },
                  },
                }),
              },
            }),
          )
          .catch(() =>
            prisma.pushNotification.delete({
              where: { id: pushNotification.id },
            }),
          );
      }),
    );
  })();
}
