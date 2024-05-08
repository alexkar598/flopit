import { prismaConnectionHelpers } from "@pothos/plugin-prisma";
import { builder, frozenWithTotalCount } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { userRef } from "../../user/schema.ts";

const filter = builder.inputType("BannedFilter", {
  fields: (t) => ({
    username: t.string({ required: false, description: "contains" }),
  }),
});

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
  args: (t) => ({
    filter: t.field({ type: filter, defaultValue: {} }),
  }),
  query: ({ filter }) => ({
    where: {
      User: {
        username: {
          contains: filter.username ?? undefined,
        },
      },
    },
  }),
  resolveNode: (parent) => parent["User"],
});

builder.prismaObjectField("Sub", "banned", (t) =>
  t.connection(
    {
      type: userRef,
      args: {
        filter: t.arg({ type: filter, defaultValue: {} }),
      },
      select: (args, ctx, nestedSelection) => ({
        ["Bans"]: helper.getQuery(args, ctx, nestedSelection),
      }),
      authScopes: ({ id }) => ({
        moderator: id,
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
