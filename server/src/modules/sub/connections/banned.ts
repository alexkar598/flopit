import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { userRef } from "../../user/schema.ts";

const helper = prismaConnectionHelpers(builder, "Ban", {
  cursor: "id",
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
          () =>
            prisma.ban.count({
              where: { sub_id: parent.id },
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
