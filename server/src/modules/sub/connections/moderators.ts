import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { userRef } from "../../user/schema.ts";

const helper = prismaConnectionHelpers(builder, "Moderator", {
  cursor: "user_id_sub_id",
  select: (nestedSelection) => ({
    ["User"]: nestedSelection({
      select: {
        id: true,
      },
    }),
  }),
  resolveNode: (parent) => parent["User"],
});

builder.prismaObjectField("Sub", "moderators", (t) =>
  t.connection(
    {
      type: userRef,
      select: (args, ctx, nestedSelection) => ({
        ["Moderators"]: helper.getQuery(args, ctx, nestedSelection),
      }),
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          helper.resolve(parent["Moderators"], args, context),
          () =>
            prisma.moderator.count({
              where: { sub_id: parent.id },
            }),
        ),
    },
    {},
    {},
  ),
);
