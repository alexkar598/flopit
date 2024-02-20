import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "./_builder.js";
import { userRef } from "./user.js";

const blockedHelper = prismaConnectionHelpers(builder, "Block", {
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
        ["Blocked"]: blockedHelper.getQuery(args, ctx, nestedSelection),
      }),
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          blockedHelper.resolve(parent["Blocked"], args, context),
          parent["Blocked"].length,
        ),
    },
    {},
    {},
  ),
);
const blockedByHelper = prismaConnectionHelpers(builder, "Block", {
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
        ["BlockedBy"]: blockedByHelper.getQuery(args, ctx, nestedSelection),
      }),
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          blockedByHelper.resolve(parent["BlockedBy"], args, context),
          parent["BlockedBy"].length,
        ),
    },
    {},
    {},
  ),
);
