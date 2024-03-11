import { builder } from "../../../builder.ts";
import { resetDatabase } from "../../../db.ts";

builder.mutationField("resetDatabase", (t) =>
  t.boolean({
    resolve: () => resetDatabase().then(() => true),
  }),
);
