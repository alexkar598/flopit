import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { getAPIError } from "../../../util.ts";
import { userRef } from "../../user/schema.ts";
import { subRef } from "../schema.ts";

const input = builder.inputType("RemoveModeratorInput", {
  fields: (t) => ({
    sub: t.globalID({ for: subRef }),
    user: t.globalID({ for: userRef }),
  }),
});

builder.mutationField("removeModerator", (t) =>
  t.withAuth({ authenticated: true }).prismaField({
    type: "Sub",
    nullable: true,
    args: { input: t.arg({ type: input }) },
    resolve: async (
      query,
      _root,
      {
        input: {
          sub: { id: sub_id },
          user: { id: user_id },
        },
      },
      { authenticated_user_id },
    ) => {
      if (authenticated_user_id === user_id)
        throw getAPIError("CANNOT_REMOVE_SELF");

      try {
        const moderator = await prisma.moderator.delete({
          select: { Sub: { ...query } },
          where: {
            user_id_sub_id: {
              user_id,
              sub_id,
            },
          },
        });

        return moderator.Sub;
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError) {
          console.log(e.code, e.meta);
          //"An operation failed because it depends on one or more records that were required but not found. {cause}"
          if (e.code === "P2025") throw getAPIError("MODERATOR_NOT_FOUND");
        }
        throw e;
      }
    },
  }),
);
