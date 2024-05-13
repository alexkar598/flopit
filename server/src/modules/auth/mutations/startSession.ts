import crypto from "crypto";
import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { getAPIError, slugify, SlugType } from "../../../util.ts";
import { compute_hash, get_token } from "../auth.ts";

// Garanti d'être 100% aléatoire, généré avec un lancer de dés
const NULL_SALT = Buffer.from(
  "c01b9823613ee86cbc67a605d9efd59d82963d334c7e1a44e341514cbc042b17",
  "hex",
);

builder.mutationField("startSession", (t) =>
  t.prismaField({
    type: "Session",
    nullable: true,
    args: {
      email: t.arg.string({}),
      password: t.arg.string({}),
    },
    grantScopes: ["self"],
    resolve: async (query, _root, { email, password }, { res }) => {
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          salt: true,
          password: true,
          id: true,
        },
      });

      const hash = await compute_hash(user?.salt ?? NULL_SALT, password);
      if (
        user?.salt === undefined ||
        user.password === undefined ||
        !crypto.timingSafeEqual(hash, user.password)
      )
        throw getAPIError("BAD_CREDENTIALS");

      const user_gid = slugify(SlugType.User, user.id);

      const session = await prisma.session.create({
        ...query,
        data: {
          user_id: user.id,
        },
        select: {
          ...query.select,
          id: true,
        },
      });

      const token = await get_token(user_gid, session.id);
      if (res) res.cork(() => res.writeHeader("Set-Cookie", token));

      return session;
    },
  }),
);
