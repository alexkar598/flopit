import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "./_builder.js";
import { userRef } from "./user.js";

const helper1 = prismaConnectionHelpers(builder, "Block", {
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
        ["Blocked"]: helper1.getQuery(args, ctx, nestedSelection),
      }),
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          helper1.resolve(parent["Blocked"], args, context),
          parent["Blocked"].length,
        ),
    },
    {},
    {},
  ),
);
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
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          helper.resolve(parent["BlockedBy"], args, context),
          parent["BlockedBy"].length,
        ),
    },
    {},
    {},
  ),
);
