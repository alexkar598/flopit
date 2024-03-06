import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { getAPIError, throwException } from "../../../util.ts";
import { subRef } from "../schema.ts";

const input = builder.inputType("UnfollowSubInput", {
  fields: (t) => ({
    subId: t.globalID({
      for: subRef,
    }),
  }),
});

builder.mutationField("unfollowSub", (t) =>
  t.prismaField({
    type: "Sub",
    nullable: true,
    args: { input: t.arg({ type: input }) },
    resolve: async (
      query,
      _,
      {
        input: {
          subId: { id: sub_id },
        },
      },
      { authenticated_user_id },
    ) => {
      if (authenticated_user_id == null)
        throw getAPIError("AUTHENTICATED_MUTATION");

      return prisma.$transaction(async (tx) => {
        try {
          await tx.follow.delete({
            where: {
              user_id_sub_id: {
                user_id: authenticated_user_id,
                sub_id,
              },
            },
          });
        } catch (e) {
          if (e instanceof PrismaClientKnownRequestError) {
            //"An operation failed because it depends on one or more records that were required but not found. {cause}"
            if (e.code === "P2025") return selectSub();
          }
          throw e;
        }

        return selectSub();

        async function selectSub() {
          return (
            (await tx.sub.findUnique({
              ...query,
              where: {
                id: sub_id,
              },
            })) ?? throwException(getAPIError("SUB_NOT_FOUND"))
          );
        }
      });
    },
  }),
);
