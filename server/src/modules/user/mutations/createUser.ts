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

const breached_passwords = new Map<string, number>();

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
      if (cleartext_password.length < 6)
        throw getAPIError(
          "INSECURE_PASSWORD",
          "Il devrait avoir au moins 6 caractères",
        );
      //Empêche de spam l'API
      let breach_count = breached_passwords.get(cleartext_password) ?? 0;
      if (breach_count)
        throw getAPIError(
          "INSECURE_PASSWORD",
          `Il fait partie de ${breach_count} brèches de données`,
        );

      const password_sha1 = crypto
        .createHash("sha1")
        .update(cleartext_password)
        .digest()
        .toString("hex")
        .toUpperCase();

      const salt = crypto.randomBytes(32);
      const [password] = await Promise.all([
        compute_hash(salt, cleartext_password),
        //Vérification en même temps
        fetch(
          "https://api.pwnedpasswords.com/range/" +
            password_sha1.substring(0, 5),
          {
            headers: { "User-Agent": "FlopIt/1.0" },
          },
        )
          .then((res) => res.text())
          .then((res) =>
            res
              .split("\n")
              .find((line) => line.startsWith(password_sha1.substring(5))),
          )
          .then((line) => {
            const breach_count = Number(line?.split(":")[1]);
            if (breach_count) {
              breached_passwords.set(cleartext_password, breach_count);
              throw getAPIError(
                "INSECURE_PASSWORD",
                `Il fait partie de ${breach_count} brèches de données`,
              );
            }
          }),
      ]);

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
