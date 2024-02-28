import { $Enums } from "@prisma/client";
import { prisma } from "../db.js";
import { builder, setupPluralIdentifyingRootFields } from "./_builder.js";

const ThemeRef = builder.enumType($Enums.Theme, {
  name: "Theme",
});
export const userRef = builder.prismaNode("User", {
  id: { field: "id" },
  select: {},
  fields: (t) => ({
    username: t.exposeString("username"),
    email: t.exposeString("email"),
    avatarOid: t.expose("avatar_oid", {
      type: "OID",
      nullable: true,
    }),
    theme: t.expose("theme", {
      type: ThemeRef,
    }),
    notifications: t.exposeBoolean("notifications"),
  }),
});

builder.queryFields((t) => ({
  users: t.prismaConnection({
    totalCount: () => prisma.user.count(),
    type: "User",
    cursor: "id",
    resolve: (query) => prisma.user.findMany({ ...query }),
  }),
}));
setupPluralIdentifyingRootFields("username", "User", "username");
