import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { getAPIError } from "../../../util.ts";
import { validate_new_password } from "../../auth/auth.ts";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { userValidators } from "../schema.ts";

const input = builder.inputType("CreateUserInput", {
  fields: (t) => ({
    email: t.string({ validate: { schema: userValidators.email } }),
    username: t.string({ validate: { schema: userValidators.username } }),
    password: t.string(),
  }),
});

builder.mutationField("createUser", (t) =>
  t.prismaField({
    type: "User",
    nullable: true,
    args: { input: t.arg({ type: input }) },
    grantScopes: ["self"],
    resolve: async (
      query,
      _root,
      { input: { email, username, password: cleartext_password } },
    ) => {
      const { salt, password } =
        await validate_new_password(cleartext_password);

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
