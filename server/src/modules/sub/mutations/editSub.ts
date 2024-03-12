import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { getAPIError } from "../../../util.ts";
import { subRef } from "../schema.ts";

const input = builder.inputType("EditSubInput", {
  fields: (t) => ({
    sub: t.globalID({ for: subRef }),
    description: t.string({ required: false }),
  }),
});

builder.mutationField("editSub", (t) =>
  t.prismaField({
    type: "Sub",
    nullable: true,
    args: { input: t.arg({ type: input }) },
    resolve: async (query, _root, { input }, { authenticated_user_id }) => {
      if (!authenticated_user_id) throw getAPIError("AUTHENTICATED_MUTATION");

      if (
        !(await prisma.moderator.findFirst({
          where: {
            user_id: authenticated_user_id,
            sub_id: input.sub.id,
          },
        }))
      )
        throw getAPIError("NOT_SUB_MODERATOR");

      return prisma.sub.update({
        ...query,
        where: { id: input.sub.id },
        data: {
          description: input.description ?? undefined,
        },
      });
    },
  }),
);
