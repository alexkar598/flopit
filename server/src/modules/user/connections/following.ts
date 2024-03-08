import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { subRef } from "../../sub/schema.ts";

const helper = prismaConnectionHelpers(builder, "Follow", {
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

builder.prismaObjectField("User", "following", (t) =>
  t.connection(
    {
      type: subRef,
      select: (args, ctx, nestedSelection) => ({
        ["FollowedSubs"]: helper.getQuery(args, ctx, nestedSelection),
      }),
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          helper.resolve(parent["FollowedSubs"], args, context),
          () =>
            prisma.follow.count({
              where: { user_id: parent.id },
            }),
        ),
    },
    {},
    {},
  ),
);
