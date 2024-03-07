import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "../../../builder.ts";
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
      resolve: (parent, args, context) =>
        frozenWithTotalCount(
          helper.resolve(parent["BannedFrom"], args, context),
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
