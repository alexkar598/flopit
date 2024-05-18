import { builder } from "../../../../builder.ts";
import { prisma } from "../../../../db.ts";
import { getAPIError, slugify, SlugType } from "../../../../util.ts";
import { commentRef } from "../../comment/schema.ts";
import { topPostRef } from "../../toppost/schema.ts";
import { notifyUser } from "../../../notifications/util.ts";
import { cache } from "../../../../cache.ts";

const input = builder.inputType("DeletePostInput", {
  fields: (t) => ({
    id: t.globalID({ for: [topPostRef, commentRef] }),
  }),
});

builder.mutationField("deletePost", (t) => {
  return t.withAuth({ authenticated: true }).prismaField({
    type: "Post",
    nullable: true,
    args: { input: t.arg({ type: input }) },
    authScopes: async (_, args, { authenticated_user_id }) => {
      const post = await prisma.post.findUnique({
        select: {
          Author: {
            select: {
              id: true,
            },
          },
          Sub: {
            select: {
              id: true,
            },
          },
        },
        where: {
          id: args.input.id.id,
        },
      });

      if (post == null) throw getAPIError("POST_NOT_FOUND");
      if (post.Author?.id === authenticated_user_id) return true;
      return {
        moderator: post.Sub.id,
      };
    },
    resolve: async (query, _root, { input }, { authenticated_user_id }) => {
      const info = await prisma.post.findUniqueOrThrow({
        where: {
          id: input.id.id,
        },
        select: {
          author_id: true,
          TopPost: {
            select: {
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
          Sub: {
            select: {
              name: true,
            },
          },
        },
      });

      if (info.author_id && info.author_id != authenticated_user_id)
        notifyUser(
          info.author_id,
          `Un modérateur de f/${info.Sub.name} a supprimé un de vos messages dans ${info.TopPost.title}`,
          `f/${info.Sub.name}/${slugify(SlugType.TopPost, info.TopPost.Post[0].id)}`,
        );
      await cache.ns("htmlContent").set(input.id.id, null);

      return prisma.post.update({
        ...query,
        where: { id: input.id.id },
        data: {
          Author: {
            disconnect: true,
          },
          delta_content: {
            ops: [{ insert: "[supprimé]", attributes: { italics: true } }],
          },
          text_content: "",
        },
      });
    },
  });
});
