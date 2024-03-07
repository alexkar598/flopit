import { builder } from "../../builder.ts";

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
