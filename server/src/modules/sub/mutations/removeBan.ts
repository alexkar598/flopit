import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { getAPIError } from "../../../util.ts";

const input = builder.inputType("RemoveBanInput", {
  fields: (t) => ({
    id: t.id(),
  }),
});

builder.mutationField("removeBan", (t) =>
  t.withAuth({ authenticated: true }).prismaField({
    type: "Sub",
    nullable: true,
    args: { input: t.arg({ type: input }) },
    authScopes: async (_, args) => {
      const ban = await prisma.ban.findUnique({
        select: { sub_id: true },
        where: { id: args.input.id.toString() },
      });
      if (ban == null) throw getAPIError("BAN_NOT_FOUND");
      return { moderator: ban.sub_id };
    },
    resolve: async (query, _root, { input: { id } }) => {
      const ban = await prisma.ban.delete({
        select: { Sub: { ...query } },
        where: {
          id: id.toString(),
        },
      });

      return ban.Sub;
    },
  }),
);
