import { builder } from "../../../builder.ts";
import { clearCookie } from "../auth.ts";

builder.mutationField("endSession", (t) =>
  t.field({
    type: "Void",
    nullable: true,
    resolve: async (_args, _root, { res }) => {
      if (res) clearCookie(res);
    },
  }),
);
