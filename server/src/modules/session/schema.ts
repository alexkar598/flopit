import { builder } from "../../builder.ts";

export const sessionRef = builder.prismaNode("Session", {
  id: { field: "id" },
  select: {
    user_id: true,
  },
  grantScopes: ({ user_id }, ctx) =>
    user_id === ctx.authenticated_user_id ? ["self"] : [],
  authScopes: { $granted: "self" },
  fields: (t) => ({
    user: t.relation("User", {
      grantScopes: ["self"],
    }),
    createdAt: t.expose("creation_time", {
      type: "DateTime",
    }),
    revokedAt: t.expose("revocation_time", {
      type: "DateTime",
      nullable: true,
    }),
  }),
});
