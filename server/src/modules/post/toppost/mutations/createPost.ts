import { builder } from "../../../../builder.ts";
import { prisma } from "../../../../db.ts";
import { subRef } from "../../../sub/schema.ts";
import { topPostRef, topPostValidators } from "../schema.ts";
import { getAPIError } from "../../../../util.ts";
import { deltaValidator, quillDeltaToPlainText } from "../../delta.ts";
import { isBanned } from "../../../sub/util.ts";
import { VoteValue } from "../../basepost/schema.ts";
import { z } from "zod";

const input = builder.inputType("CreatePostInput", {
  fields: (t) => ({
    title: t.string({
      validate: {
        schema: topPostValidators.title,
      },
    }),
    sub: t.globalID({ for: subRef }),
    delta_content: t.field({
      type: "JSON",
      validate: { schema: deltaValidator },
    }),
  }),
});

builder.mutationField("createPost", (t) =>
  t.withAuth({ authenticated: true }).prismaField({
    type: topPostRef,
    nullable: true,
    args: { input: t.arg({ type: input }) },
    resolve: async (query, _root, { input }, { authenticated_user_id }) => {
      const delta = input.delta_content as z.infer<typeof deltaValidator>;

      return prisma.$transaction(async (tx) => {
        const subId = await tx.sub
          .findUnique({
            select: { id: true },
            where: { id: input.sub.id },
          })
          .then((sub) => sub?.id);

        if (!subId) throw getAPIError("SUB_NOT_FOUND");

        if (await isBanned(authenticated_user_id, subId, tx))
          throw getAPIError("BANNED");

        return tx.post.create({
          ...query,
          data: {
            TopPost: {
              create: {
                title: input.title,
              },
            },
            Author: {
              connect: { id: authenticated_user_id },
            },
            Sub: {
              connect: { id: subId },
            },
            Votes: {
              create: {
                user_id: authenticated_user_id,
                value: VoteValue.Up,
              },
            },
            delta_content: delta,
            text_content: quillDeltaToPlainText(delta),
            cached_votes: 1,
          },
        });
      });
    },
  }),
);
