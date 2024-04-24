import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { getAPIError } from "../../../util.ts";
import { userRef } from "../../user/schema.ts";
import { subRef } from "../schema.ts";

const input = builder.inputType("AddModeratorInput", {
  fields: (t) => ({
    sub: t.globalID({ for: subRef }),
    user: t.globalID({ for: userRef, required: false }),
    username: t.string({ required: false }),
  }),
});

builder.mutationField("addModerator", (t) =>
  t.prismaField({
    type: "Sub",
    nullable: true,
    args: { input: t.arg({ type: input }) },
    resolve: async (
      query,
      _root,
      {
        input: {
          sub: { id: sub_id },
          user,
          username,
        },
      },
      { authenticated_user_id },
    ) => {
      if (!authenticated_user_id) throw getAPIError("AUTHENTICATED_MUTATION");

      const user_id = user?.id;

      if ((user_id == null) === (username == null))
        throw getAPIError("MUTUALLY_EXCLUSIVE_REQUIRED", "user_id et username");

      try {
        const moderator = await prisma.moderator.create({
          select: { Sub: { ...query } },
          data: {
            User: {
              connect: {
                id: user_id ?? undefined,
                username: username ?? undefined,
              },
            },
            Sub: {
              connect: {
                id: sub_id,
              },
            },
          },
        });

        return moderator.Sub;
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError) {
          console.log(e.code, e.meta);
          //"Unique constraint failed on the {constraint}"
          if (e.code === "P2002" && e.meta?.target === "PRIMARY")
            throw getAPIError("ALREADY_MODERATOR");
          //"An operation failed because it depends on one or more records that were required but not found. {cause}"
          if (
            e.code === "P2025" &&
            (e.meta?.cause as string).includes("'User'")
          )
            throw getAPIError("USER_NOT_FOUND");
          //"An operation failed because it depends on one or more records that were required but not found. {cause}"
          if (e.code === "P2025" && (e.meta?.cause as string).includes("'Sub'"))
            throw getAPIError("SUB_NOT_FOUND");
        }
        throw e;
      }
    },
  }),
);
