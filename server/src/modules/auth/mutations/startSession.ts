import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { slugify, SlugType } from "../../../util.ts";
import { get_token, validate_user_credentials } from "../auth.ts";

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
      const user = await validate_user_credentials({ email }, password);

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
