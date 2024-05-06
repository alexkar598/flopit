import { z } from "zod";
import { builder, setupPluralIdentifyingRootFields } from "../../builder.ts";
import { prisma } from "../../db.ts";

const filter = builder.inputType("SubsFilter", {
  fields: (t) => ({
    name: t.string({ required: false, description: "contains" }),
    description: t.string({
      required: false,
      description: "fulltext",
      validate: {
        schema: z.string().trim().min(1, "Recherche doit avoir 1 charactère"),
      },
    }),
  }),
});

builder.queryField("subs", (t) =>
  t.prismaConnection({
    args: {
      filter: t.arg({ type: filter, required: false }),
    },
    totalCount: (_, { filter }) =>
      prisma.sub.count({
        where: {
          name: { contains: filter?.name ?? undefined },
          description: { search: filter?.description ?? undefined },
        },
      }),
    type: "Sub",
    cursor: "id",
    resolve: (query, _root, { filter }) =>
      prisma.sub.findMany({
        ...query,
        where: {
          name: { contains: filter?.name ?? undefined },
          description: { search: filter?.description ?? undefined },
        },
        orderBy:
          filter?.description == null
            ? undefined
            : {
                _relevance: {
                  fields: ["description"],
                  search: filter.description,
                  sort: "desc",
                },
              },
      }),
  }),
);
setupPluralIdentifyingRootFields("name", "Sub", "name");
