import { builder } from "../../../builder.ts";

builder.prismaObjectField("User", "pushNotifications", (t) =>
  t.relatedConnection("PushNotifications", {
    cursor: "id",
    totalCount: true,
  }),
);
