import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "../../../builder.ts";
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
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          helper.resolve(parent["ModeratedSubs"], args, context),
          parent["ModeratedSubs"].length,
        ),
    },
    {},
    {},
  ),
);
