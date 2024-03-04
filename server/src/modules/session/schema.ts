import { builder } from "../../builder.ts";

export const sessionRef = builder.prismaNode("Session", {
  id: { field: "id" },
  select: {},
  fields: (t) => ({
    user: t.relation("User"),
    createdAt: t.expose("creation_time", {
      type: "DateTime",
    }),
    revokedAt: t.expose("revocation_time", {
      type: "DateTime",
      nullable: true,
    }),
  }),
});
