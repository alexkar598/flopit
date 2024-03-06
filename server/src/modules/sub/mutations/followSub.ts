import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { getAPIError } from "../../../util.ts";
import { subRef } from "../schema.ts";

const input = builder.inputType("FollowSubInput", {
  fields: (t) => ({
    subId: t.globalID({
      for: subRef,
    }),
  }),
});

builder.mutationField("followSub", (t) =>
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

      try {
        await prisma.follow.create({
          data: {
            user_id: authenticated_user_id,
            sub_id,
          },
        });
      } catch (e) {
        if (
          !(e instanceof PrismaClientKnownRequestError) ||
          e.code !== "P2002" ||
          e.meta?.target !== "PRIMARY"
        ) {
          throw e;
        }
      }

      return prisma.sub.findUniqueOrThrow({
        ...query,
        where: {
          id: sub_id,
        },
      });
    },
  }),
);
