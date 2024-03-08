import { builder, setupPluralIdentifyingRootFields } from "../../builder.ts";
import { prisma } from "../../db.ts";

builder.queryField("subs", (t) =>
  t.prismaConnection({
    totalCount: () => prisma.sub.count(),
    type: "Sub",
    cursor: "id",
    resolve: (query) => {
      console.log(query);
      return prisma.sub.findMany({ ...query });
    },
  }),
);
setupPluralIdentifyingRootFields("name", "Sub", "name");
