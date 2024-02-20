import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "./_builder.ts";
import { subRef } from "./sub.ts";
import { userRef } from "./user.ts";

const helper1 = prismaConnectionHelpers(builder, "Ban", {
  cursor: "user_id_sub_id_expiry",
  select: (nestedSelection) => ({
    expiry: true,
    reason: true,
    ["Sub"]: nestedSelection({
      select: {
        id: true,
      },
    }),
  }),
  resolveNode: (parent) => parent["Sub"],
});

builder.prismaObjectField("User", "bannedFrom", (t) =>
  t.connection(
    {
      type: subRef,
      select: (args, ctx, nestedSelection) => ({
        ["BannedFrom"]: helper1.getQuery(args, ctx, nestedSelection),
      }),
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          helper1.resolve(parent["BannedFrom"], args, context),
          parent["BannedFrom"].length,
        ),
    },
    {},
    {
      fields: (t) => ({
        expiry: t.expose("expiry", {
          type: "DateTime",
        }),
        reason: t.exposeString("reason"),
      }),
    },
  ),
);

const helper = prismaConnectionHelpers(builder, "Ban", {
  cursor: "user_id_sub_id_expiry",
  select: (nestedSelection) => ({
    expiry: true,
    reason: true,
    ["User"]: nestedSelection({
      select: {
        id: true,
      },
    }),
  }),
  resolveNode: (parent) => parent["User"],
});

builder.prismaObjectField("Sub", "banned", (t) =>
  t.connection(
    {
      type: userRef,
      select: (args, ctx, nestedSelection) => ({
        ["Bans"]: helper.getQuery(args, ctx, nestedSelection),
      }),
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          helper.resolve(parent["Bans"], args, context),
          parent["Bans"].length,
        ),
    },
    {},
    {
      fields: (t) => ({
        expiry: t.expose("expiry", {
          type: "DateTime",
        }),
        reason: t.exposeString("reason"),
      }),
    },
  ),
);
