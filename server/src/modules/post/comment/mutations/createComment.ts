import { builder } from "../../../../builder.ts";
import { prisma } from "../../../../db.ts";
import { getAPIError } from "../../../../util.ts";
import { deltaValidator, quillDeltaToPlainText } from "../../delta.ts";
import { VoteValue } from "../../basepost/schema.ts";
import { z } from "zod";
import { topPostRef } from "../../toppost/schema.ts";
import { commentRef } from "../schema.ts";

const input = builder.inputType("CreateCommentInput", {
  fields: (t) => ({
    parent: t.globalID({ for: [topPostRef, commentRef] }),
    delta_content: t.field({
      type: "JSON",
      validate: { schema: deltaValidator },
    }),
  }),
});

builder.mutationField("createComment", (t) =>
  t.withAuth({ authenticated: true }).prismaField({
    type: commentRef,
    nullable: true,
    args: { input: t.arg({ type: input }) },
    authScopes: async (_, args) => {
      const post = await prisma.post.findUnique({
        select: { sub_id: true },
        where: { id: args.input.parent.id },
      });
      if (post == null) throw getAPIError("POST_NOT_FOUND");
      return { notBanned: post.sub_id };
    },
    resolve: async (query, _root, { input }, { authenticated_user_id }) => {
      const delta = input.delta_content as z.infer<typeof deltaValidator>;

      return prisma.$transaction(async (tx) => {
        const parent = await tx.post.findUnique({
          select: { sub_id: true, top_post_id: true },
          where: { id: input.parent.id },
        });

        if (parent == null) throw getAPIError("POST_NOT_FOUND");

        return tx.post.create({
          ...query,
          data: {
            top_post_id: parent.top_post_id,
            author_id: authenticated_user_id,
            sub_id: parent.sub_id,
            delta_content: delta,
            text_content: quillDeltaToPlainText(delta),
            cached_votes: 1,
            parent_id: input.parent.id,
            Votes: {
              create: {
                user_id: authenticated_user_id,
                value: VoteValue.Up,
              },
            },
          },
        });
      });
    },
  }),
);
