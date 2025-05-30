import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { userRef } from "../schema.ts";

const helper = prismaConnectionHelpers(builder, "Block", {
  cursor: "blocked_id_blocker_id",
  select: (nestedSelection) => ({
    ["Blocker"]: nestedSelection({
      select: {
        id: true,
      },
    }),
  }),
  resolveNode: (parent) => parent["Blocker"],
});

builder.prismaObjectField("User", "blockedBy", (t) =>
  t.connection(
    {
      type: userRef,
      select: (args, ctx, nestedSelection) => ({
        ["BlockedBy"]: helper.getQuery(args, ctx, nestedSelection),
      }),
      authScopes: { $granted: "self" },
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          helper.resolve(parent["BlockedBy"], args, context),
          () =>
            prisma.block.count({
              where: { blocked_id: parent.id },
            }),
        ),
    },
    {},
    {},
  ),
);
