import { $Enums } from "@prisma/client";
import { builder } from "../../builder.js";
import { getImg } from "../../util.ts";
import { z } from "zod";

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
      resolve: ({ avatar_oid }) => getImg(avatar_oid),
    }),
    theme: t.expose("theme", {
      type: ThemeRef,
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
      /^[a-zA-Z0-9_-]*$/,
      "Le nom d'utilisateur doit comprendre uniquement des lettres non-accentuées, des nombres et les caractères _ et -",
    ),
};
