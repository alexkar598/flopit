import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { subRef } from "../../sub/schema.ts";

builder.mutationField("forceModerator", (t) => {
  return t.withAuth({ authenticated: true }).prismaField({
    type: subRef,
    nullable: true,
    args: { id: t.arg.globalID({ for: subRef }) },
    resolve: async (query, _root, args, { authenticated_user_id }) => {
      return (
        await prisma.moderator.upsert({
          select: {
            Sub: { ...query },
          },
          where: {
            user_id_sub_id: {
              user_id: authenticated_user_id,
              sub_id: args.id.id,
            },
          },
          update: {
            user_id: authenticated_user_id,
            sub_id: args.id.id,
          },
          create: {
            user_id: authenticated_user_id,
            sub_id: args.id.id,
          },
        })
      ).Sub;
    },
  });
});
