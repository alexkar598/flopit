import { $Enums } from "@prisma/client";
import { builder } from "../../builder.js";
import { getImg } from "../../util.ts";
import { z } from "zod";

export const ThemeRef = builder.enumType($Enums.Theme, {
  name: "Theme",
});
export const userRef = builder.prismaNode("User", {
  id: { field: "id" },
  select: { id: true },
  grantScopes: ({ id }, ctx) =>
    id === ctx.authenticated_user_id ? ["self"] : [],
  fields: (t) => ({
    username: t.exposeString("username"),
    email: t.exposeString("email", {
      authScopes: { $granted: "self" },
    }),
    avatarUrl: t.string({
      select: {
        avatar_oid: true,
      },
      nullable: true,
      resolve: ({ avatar_oid }) =>
        getImg(avatar_oid, { width: 64, height: 64, resizeMode: "fill" }),
    }),
    theme: t.expose("theme", {
      type: ThemeRef,
      authScopes: { $granted: "self" },
    }),
  }),
});

export const userValidators = {
  email: z
    .string()
    .trim()
    .email("L'adresse courriel doit être une adresse valide"),
  username: z
    .string()
    .trim()
    .min(3, "Le nom d'utilisateur doit avoir minimalement 3 caractères")
    .regex(
      /^[a-zA-Z0-9_\-\p{Emoji_Presentation}]*$/u,
      "Le nom d'utilisateur doit comprendre uniquement des lettres non-accentuées, des nombres, des emojis et les caractères _ et -",
    ),
};
