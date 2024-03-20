import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { getAPIError } from "../../../util.ts";

const input = builder.inputType("CreateSubInput", {
  fields: (t) => ({
    name: t.string(),
    description: t.string({ required: false }),
  }),
});

builder.mutationField("createSub", (t) =>
  t.prismaField({
    type: "Sub",
    nullable: true,
    args: { input: t.arg({ type: input }) },
    resolve: (
      query,
      _root,
      { input: { name, description } },
      { authenticated_user_id },
    ) => {
      if (!authenticated_user_id) throw getAPIError("AUTHENTICATED_MUTATION");

      return prisma.$transaction(async (tx) => {
        try {
          const moderator = await tx.moderator.create({
            select: { sub_id: true },
            data: {
              User: {
                connect: {
                  id: authenticated_user_id,
                },
              },
              Sub: {
                create: {
                  name,
                  description: description ?? undefined,
                  Followers: {
                    create: {
                      user_id: authenticated_user_id,
                    },
                  },
                },
              },
            },
          });

          return await tx.sub.findUnique({
            ...query,
            where: { id: moderator.sub_id },
          });
        } catch (e) {
          if (e instanceof PrismaClientKnownRequestError) {
            //"Unique constraint failed on the {constraint}"
            if (e.code === "P2002" && e.meta?.target === "Sub_name_key")
              throw getAPIError("DUPLICATE_SUB_NAME");
          }
          throw e;
        }
      });
    },
  }),
);
