import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "./_builder.js";
import { subRef } from "./sub.ts";
import { userRef } from "./user.js";

const followingHelper = prismaConnectionHelpers(builder, "Follow", {
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
        ["FollowedSubs"]: followingHelper.getQuery(args, ctx, nestedSelection),
      }),
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          followingHelper.resolve(parent["FollowedSubs"], args, context),
          parent["FollowedSubs"].length,
        ),
    },
    {},
    {},
  ),
);
const followersHelper = prismaConnectionHelpers(builder, "Follow", {
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
        ["Followers"]: followersHelper.getQuery(args, ctx, nestedSelection),
      }),
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          followersHelper.resolve(parent["Followers"], args, context),
          parent["Followers"].length,
        ),
    },
    {},
    {},
  ),
);
