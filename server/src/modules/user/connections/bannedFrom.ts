import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { subRef } from "../../sub/schema.ts";

const helper = prismaConnectionHelpers(builder, "Ban", {
  cursor: "id",
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
        ["BannedFrom"]: helper.getQuery(args, ctx, nestedSelection),
      }),
      authScopes: { $granted: "self" },
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          helper.resolve(parent["BannedFrom"], args, context),
          () =>
            prisma.ban.count({
              where: { user_id: parent.id },
            }),
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
