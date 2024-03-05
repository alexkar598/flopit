import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "../../../builder.ts";
import { userRef } from "../schema.ts";

const helper = prismaConnectionHelpers(builder, "Block", {
  cursor: "blocked_id_blocker_id",
  select: (nestedSelection) => ({
    ["Blocked"]: nestedSelection({
      select: {
        id: true,
      },
    }),
  }),
  resolveNode: (parent) => parent["Blocked"],
});

builder.prismaObjectField("User", "blocked", (t) =>
  t.connection(
    {
      type: userRef,
      select: (args, ctx, nestedSelection) => ({
        ["Blocked"]: helper.getQuery(args, ctx, nestedSelection),
      }),
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          helper.resolve(parent["Blocked"], args, context),
          parent["Blocked"].length,
        ),
    },
    {},
    {},
  ),
);
