import { builder } from "../../../../builder.ts";
import { cache } from "../../../../cache.ts";
import { prisma } from "../../../../db.ts";
import { getAPIError } from "../../../../util.ts";
import { deltaValidator, uploadDeltaImagesToS3 } from "../../delta.ts";
import { commentRef } from "../schema.ts";

const input = builder.inputType("EditCommentInput", {
  fields: (t) => ({
    id: t.globalID({ for: [commentRef] }),
    delta_content: t.field({
      type: "JSON",
      validate: { schema: deltaValidator },
      required: false,
    }),
  }),
});

builder.mutationField("editComment", (t) => {
  return t.withAuth({ authenticated: true }).prismaField({
    type: commentRef,
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
        },
        where: {
          id: args.input.id.id,
        },
      });
      if (post == null) throw getAPIError("POST_NOT_FOUND");
      return post.Author?.id === authenticated_user_id;
    },
    resolve: async (query, _root, { input }) => {
      if (input.delta_content != null)
        await uploadDeltaImagesToS3(input.delta_content as any);

      await cache.ns("htmlContent").set(input.id.id, null);

      return prisma.post.update({
        ...query,
        where: { id: input.id.id },
        data: {
          delta_content: input.delta_content ?? undefined,
        },
      });
    },
  });
});
