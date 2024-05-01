import { builder } from "../../builder.ts";

export const pushNotificationRef = builder.prismaNode("PushNotification", {
  id: { field: "id" },
  select: { user_id: true },
  grantScopes: ({ user_id }, ctx) =>
    user_id === ctx.authenticated_user_id ? ["self"] : [],
  authScopes: { $granted: "self" },
  fields: (t) => ({
    user: t.relation("User"),
  }),
});
