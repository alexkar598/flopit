import { builder } from "../../builder.ts";

export const pushNotificationRef = builder.prismaNode("PushNotification", {
  id: { field: "id" },
  select: {},
  fields: (t) => ({
    user: t.relation("User"),
  }),
});
