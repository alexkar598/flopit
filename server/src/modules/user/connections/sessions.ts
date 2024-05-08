import { builder } from "../../../builder.ts";

builder.prismaObjectField("User", "sessions", (t) =>
  t.relatedConnection("Sessions", {
    authScopes: { $granted: "self" },
    cursor: "id",
    totalCount: true,
  }),
);
