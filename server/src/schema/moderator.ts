import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "./_builder.ts";
import { subRef } from "./sub.ts";
import { userRef } from "./user.ts";

const moderatorsHelper = prismaConnectionHelpers(builder, "Moderator", {
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
        ["Moderators"]: moderatorsHelper.getQuery(args, ctx, nestedSelection),
      }),
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          moderatorsHelper.resolve(parent["Moderators"], args, context),
          parent["Moderators"].length,
        ),
    },
    {},
    {},
  ),
);

const moderatorOfHelper = prismaConnectionHelpers(builder, "Moderator", {
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
        ["ModeratedSubs"]: moderatorOfHelper.getQuery(
          args,
          ctx,
          nestedSelection,
        ),
      }),
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          moderatorOfHelper.resolve(parent["ModeratedSubs"], args, context),
          parent["ModeratedSubs"].length,
        ),
    },
    {},
    {},
  ),
);
