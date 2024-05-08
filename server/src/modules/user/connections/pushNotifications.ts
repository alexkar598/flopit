import { builder } from "../../../builder.ts";

builder.prismaObjectField("User", "pushNotifications", (t) =>
  t.relatedConnection("PushNotifications", {
    authScopes: { $granted: "self" },
    cursor: "id",
    totalCount: true,
  }),
);
