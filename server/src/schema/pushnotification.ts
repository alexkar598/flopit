import { builder } from "./_builder.ts";

builder.prismaNode("PushNotification", {
  id: { field: "id" },
  select: {},
  fields: (t) => ({
    user: t.relation("User"),
  }),
});
builder.prismaObjectField("User", "pushNotifications", (t) =>
  t.relatedConnection("PushNotifications", {
    cursor: "id",
    totalCount: true,
  }),
);
