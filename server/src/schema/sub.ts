import { prisma } from "../db.ts";
import { builder, setupPluralIdentifyingRootFields } from "./_builder.ts";

export const subRef = builder.prismaNode("Sub", {
  id: { field: "id" },
  select: {},
  fields: (t) => ({
    name: t.exposeString("name"),
    description: t.exposeString("description"),
    iconOid: t.expose("icon_oid", {
      type: "OID",
      nullable: true,
    }),
    bananerOid: t.expose("banner_oid", {
      type: "OID",
      nullable: true,
    }),
  }),
});

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
