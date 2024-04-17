import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { getAPIError } from "../../../util.ts";
import { clearCookie } from "../../auth/auth.ts";

builder.mutationField("deleteUser", (t) =>
  t.prismaField({
    type: "User",
    nullable: true,
    resolve: (query, _root, _args, { authenticated_user_id, res }) => {
      if (authenticated_user_id == null)
        throw getAPIError("AUTHENTICATED_MUTATION");

      clearCookie(res);
      return prisma.user.delete({
        ...query,
        where: {
          id: authenticated_user_id,
        },
      });
    },
  }),
);
