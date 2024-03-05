import { $Enums } from "@prisma/client";
import { builder } from "../../builder.js";

export const ThemeRef = builder.enumType($Enums.Theme, {
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
  }),
});
