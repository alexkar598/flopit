import { builder } from "../../builder.ts";

builder.queryField("pushNotificationsPublicKey", (t) =>
  t.string({
    resolve: () => process.env.VAPID_PUBLIC_KEY!,
  }),
);
