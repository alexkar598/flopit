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
    resolve: async (query, _root, { input: { name, description } }) => {
      try {
        return await prisma.sub.create({
          ...query,
          data: {
            name,
            description: description ?? undefined,
          },
        });
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError) {
          //"Unique constraint failed on the {constraint}"
          if (e.code === "P2002" && e.meta?.target === "Sub_name_key")
            throw getAPIError("DUPLICATE_SUB_NAME");
        }
        throw e;
      }
    },
  }),
);
