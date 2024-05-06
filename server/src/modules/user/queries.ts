import { builder, setupPluralIdentifyingRootFields } from "../../builder.ts";
import { prisma } from "../../db.ts";

const filter = builder.inputType("UsersFilter", {
  fields: (t) => ({
    username: t.string({ required: false }),
  }),
});

builder.queryFields((t) => ({
  users: t.prismaConnection({
    args: {
      filter: t.arg({
        type: filter,
        required: false,
      }),
    },
    totalCount: () => prisma.user.count(),
    type: "User",
    cursor: "id",
    resolve: (query, _, { filter }) =>
      prisma.user.findMany({
        ...query,
        where: {
          username: {
            startsWith: filter?.username ?? undefined,
          },
        },
      }),
  }),
}));
setupPluralIdentifyingRootFields("username", "User", "username");
