import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import crypto from "crypto";
import { getAPIError } from "../../../util.ts";
import { compute_hash } from "../../auth/auth.ts";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const input = builder.inputType("CreateUserInput", {
  fields: (t) => ({
    email: t.string(),
    username: t.string(),
    password: t.string(),
  }),
});

builder.mutationField("createUser", (t) =>
  t.prismaField({
    type: "User",
    nullable: true,
    args: { input: t.arg({ type: input }) },
    resolve: async (
      query,
      _root,
      { input: { email, username, password: cleartext_password } },
    ) => {
      if (cleartext_password.length < 6) throw getAPIError("TRIVIAL_PASSWORD");

      const salt = crypto.randomBytes(32);
      const password = await compute_hash(salt, cleartext_password);

      try {
        return await prisma.user.create({
          ...query,
          data: {
            salt,
            username,
            email,
            password,
          },
        });
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError) {
          //"Unique constraint failed on the {constraint}"
          if (e.code === "P2002" && e.meta?.target === "User_username_key")
            throw getAPIError("DUPLICATE_USERNAME");
          //"Unique constraint failed on the {constraint}"
          if (e.code === "P2002" && e.meta?.target === "User_email_key")
            throw getAPIError("DUPLICATE_EMAIL");
        }
        throw e;
      }
    },
  }),
);
