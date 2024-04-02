import { $Enums } from "@prisma/client";
import { builder } from "../../builder.js";
import { getImg } from "../../util.ts";

export const ThemeRef = builder.enumType($Enums.Theme, {
  name: "Theme",
});
export const userRef = builder.prismaNode("User", {
  id: { field: "id" },
  select: {},
  fields: (t) => ({
    username: t.exposeString("username"),
    email: t.exposeString("email"),
    avatarUrl: t.string({
      select: {
        avatar_oid: true,
      },
      nullable: true,
      resolve: (user) => getImg(user.avatar_oid),
    }),
    theme: t.expose("theme", {
      type: ThemeRef,
    }),
  }),
});
