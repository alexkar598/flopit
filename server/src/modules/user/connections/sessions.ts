import { builder } from "../../../builder.ts";

builder.prismaObjectField("User", "sessions", (t) =>
  t.relatedConnection("Sessions", {
    cursor: "id",
    totalCount: true,
  }),
);
