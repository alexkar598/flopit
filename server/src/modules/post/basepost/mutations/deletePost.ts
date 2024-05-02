import { builder } from "../../../../builder.ts";
import { prisma } from "../../../../db.ts";
import { getAPIError } from "../../../../util.ts";
import { commentRef } from "../../comment/schema.ts";
import { topPostRef } from "../../toppost/schema.ts";

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
    resolve: (query, _root, { input }) =>
      prisma.post.update({
        ...query,
        where: { id: input.id.id },
        data: {
          Author: {
            disconnect: true,
          },
          delta_content: {
            ops: [{ insert: "[supprimé]", attributes: { italics: true } }],
          },
          TopPost: {
            update: {
              title: "[supprimé]",
            },
          },
          text_content: "",
        },
      }),
  });
});
