import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { userRef } from "../../user/schema.ts";

const helper = prismaConnectionHelpers(builder, "Follow", {
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

builder.prismaObjectField("Sub", "followers", (t) =>
  t.connection(
    {
      type: userRef,
      select: (args, ctx, nestedSelection) => ({
        ["Followers"]: helper.getQuery(args, ctx, nestedSelection),
      }),
      resolve: async (parent, args, context) => {
        const user_id = context.authenticated_user_id;
        const isMod =
          user_id != null &&
          !!(await prisma.moderator.findUnique({
            where: { user_id_sub_id: { sub_id: parent.id, user_id } },
          }));

        return frozenWithTotalCount(
          helper.resolve(isMod ? parent["Followers"] : [], args, context),
          () =>
            prisma.follow.count({
              where: { sub_id: parent.id },
            }),
        );
      },
    },
    {},
    {},
  ),
);
