import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
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
      authScopes: { $granted: "self" },
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          helper.resolve(parent["Blocked"], args, context),
          () =>
            prisma.block.count({
              where: { blocker_id: parent.id },
            }),
        ),
    },
    {},
    {},
  ),
);
