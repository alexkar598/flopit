import { builder, setupPluralIdentifyingRootFields } from "../../builder.ts";
import { prisma } from "../../db.ts";

const filter = builder.inputType("SubsFilter", {
  fields: (t) => ({
    name: t.string({ required: false }),
  }),
});

builder.queryField("subs", (t) =>
  t.prismaConnection({
    args: {
      filter: t.arg({ type: filter }),
    },
    totalCount: (_, { filter }) =>
      prisma.sub.count({
        where: {
          name: { contains: filter.name ?? undefined },
        },
      }),
    type: "Sub",
    cursor: "id",
    resolve: (query, _root, { filter }) => {
      return prisma.sub.findMany({
        ...query,
        where: {
          name: { contains: filter.name ?? undefined },
        },
      });
    },
  }),
);
setupPluralIdentifyingRootFields("name", "Sub", "name");
