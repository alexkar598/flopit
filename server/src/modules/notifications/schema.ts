import { builder } from "../../builder.ts";

export interface Notification {
  id: string;
  url?: string;
  message: string;
}

export const notificationRef = builder.objectRef<Notification>("Notification");

export const NotificationConnection = builder.connectionObject({
  type: notificationRef,
  name: "NotificationConnection",
});

notificationRef.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    url: t.exposeString("url", { nullable: true }),
    message: t.exposeString("message"),
    created: t.field({
      type: "DateTime",
      resolve: (message) => new Date(parseInt(message.id.split("-")[0])),
    }),
  }),
});
