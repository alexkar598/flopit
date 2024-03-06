import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "../../../builder.ts";
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
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          helper.resolve(parent["Followers"], args, context),
          parent["Followers"].length,
        ),
    },
    {},
    {},
  ),
);
