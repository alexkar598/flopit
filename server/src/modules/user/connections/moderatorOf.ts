import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { subRef } from "../../sub/schema.ts";

const helper = prismaConnectionHelpers(builder, "Moderator", {
  cursor: "user_id_sub_id",
  select: (nestedSelection) => ({
    ["Sub"]: nestedSelection({
      select: {
        id: true,
      },
    }),
  }),
  resolveNode: (parent) => parent["Sub"],
});

builder.prismaObjectField("User", "moderatorOf", (t) =>
  t.connection(
    {
      type: subRef,
      select: (args, ctx, nestedSelection) => ({
        ["ModeratedSubs"]: helper.getQuery(args, ctx, nestedSelection),
      }),
      authScopes: { $granted: "self" },
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          helper.resolve(parent["ModeratedSubs"], args, context),
          () =>
            prisma.moderator.count({
              where: { user_id: parent.id },
            }),
        ),
    },
    {},
    {},
  ),
);
