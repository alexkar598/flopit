import { builder, setupPluralIdentifyingRootFields } from "../../builder.ts";
import { prisma } from "../../db.ts";

builder.queryFields((t) => ({
  users: t.prismaConnection({
    totalCount: () => prisma.user.count(),
    type: "User",
    cursor: "id",
    resolve: (query) => prisma.user.findMany({ ...query }),
  }),
}));
setupPluralIdentifyingRootFields("username", "User", "username");
