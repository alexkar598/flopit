import { builder } from "../../../../builder.ts";
import { prisma } from "../../../../db.ts";
import { topPostRef } from "../schema.ts";
import { getAPIError } from "../../../../util.ts";
import { deltaValidator, quillDeltaToPlainText } from "../../delta.ts";
import { isBanned } from "../../../sub/util.ts";
import { VoteValue } from "../../basepost/schema.ts";

const input = builder.inputType("CreatePostInput", {
  fields: (t) => ({
    title: t.string(),
    sub_name: t.string(),
    delta_content: t.field({ type: "JSON" }),
  }),
});

builder.mutationField("createPost", (t) =>
  t.prismaField({
    type: topPostRef,
    nullable: true,
    args: { input: t.arg({ type: input }) },
    resolve: async (query, _root, { input }, { authenticated_user_id }) => {
      if (!authenticated_user_id) throw getAPIError("AUTHENTICATED_MUTATION");

      return prisma.$transaction(async (tx) => {
        if (!input.title.length) throw getAPIError("TITLE_TOO_SHORT");

        const delta = await deltaValidator.safeParseAsync(input.delta_content);
        if (!delta.success) throw getAPIError("INVALID_DELTA");

        const subId = await tx.sub
          .findUnique({
            select: { id: true },
            where: { name: input.sub_name },
          })
          .then((sub) => sub?.id);

        if (!subId) throw getAPIError("SUB_NOT_FOUND");

        if (await isBanned(authenticated_user_id, subId, tx))
          throw getAPIError("BANNED");

        const post = await tx.post.create({
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
            delta_content: delta.data,
            text_content: quillDeltaToPlainText(delta.data),
            cached_votes: 1,
          },
        });

        await tx.vote.create({
          data: {
            user_id: authenticated_user_id,
            post_id: post.id,
            value: VoteValue.Up,
          },
        });
        return post;
      });
    },
  }),
);
