import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { clearCookie } from "../../auth/auth.ts";

builder.mutationField("deleteUser", (t) =>
  t.withAuth({ authenticated: true }).prismaField({
    type: "User",
    nullable: true,
    resolve: (query, _root, _args, { authenticated_user_id, res }) => {
      if (res) clearCookie(res);
      return prisma.user.delete({
        ...query,
        where: {
          id: authenticated_user_id,
        },
      });
    },
  }),
);
