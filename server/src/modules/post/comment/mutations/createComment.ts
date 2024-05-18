import { builder } from "../../../../builder.ts";
import { prisma } from "../../../../db.ts";
import { deepMerge, getAPIError, slugify, SlugType } from "../../../../util.ts";
import {
  deltaValidator,
  quillDeltaToPlainText,
  uploadDeltaImagesToS3,
} from "../../delta.ts";
import { VoteValue } from "../../basepost/schema.ts";
import { z } from "zod";
import { topPostRef } from "../../toppost/schema.ts";
import { commentRef } from "../schema.ts";
import { notifyUser } from "../../../notifications/util.ts";
import { Prisma } from "@prisma/client";

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
        const info = await tx.post.findUnique({
          select: {
            sub_id: true,
            author_id: true,
            TopPost: {
              select: {
                id: true,
                title: true,
                Post: {
                  where: {
                    parent_id: null,
                  },
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
          where: { id: input.parent.id },
        });

        if (info == null) throw getAPIError("POST_NOT_FOUND");

        // upload images to S3
        await uploadDeltaImagesToS3(delta);

        const post = await tx.post.create({
          ...query,
          select: deepMerge(query.select ?? {}, {
            Author: {
              select: {
                username: true,
              },
            },
            Sub: {
              select: {
                name: true,
              },
            },
          } satisfies Prisma.PostSelect),
          data: {
            top_post_id: info.TopPost.id,
            author_id: authenticated_user_id,
            sub_id: info.sub_id,
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

        if (info.author_id && info.author_id != authenticated_user_id)
          notifyUser(
            info.author_id,
            `u/${post.Author!.username} a laissé un commentaire sur un de vos messages dans ${info.TopPost.title}`,
            `f/${post.Sub.name}/${slugify(SlugType.TopPost, info.TopPost.Post[0].id)}`,
          );

        return post;
      });
    },
  }),
);
