import { z } from "zod";
import { builder } from "../../../../builder.ts";
import { prisma } from "../../../../db.ts";
import { getAPIError } from "../../../../util.ts";
import {
  deltaValidator,
  quillDeltaToPlainText,
  uploadDeltaImagesToS3,
} from "../../delta.ts";
import { topPostRef, topPostValidators } from "../schema.ts";
import { cache } from "../../../../cache.ts";

const input = builder.inputType("EditTopPostInput", {
  fields: (t) => ({
    id: t.globalID({ for: topPostRef }),
    title: t.string({
      validate: {
        schema: topPostValidators.title,
      },
      required: false,
    }),
    delta_content: t.field({
      type: "JSON",
      validate: { schema: deltaValidator },
      required: false,
    }),
  }),
});

builder.mutationField("editTopPost", (t) => {
  return t.withAuth({ authenticated: true }).prismaField({
    type: topPostRef,
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
      const delta = input.delta_content as z.infer<typeof deltaValidator>;

      if (delta != null) await uploadDeltaImagesToS3(delta);

      await cache.ns("htmlContent").set(input.id.id, null);

      return prisma.post.update({
        ...query,
        where: { id: input.id.id },
        data: {
          delta_content: delta ?? undefined,
          text_content:
            delta === undefined ? undefined : quillDeltaToPlainText(delta),
          TopPost: {
            update: {
              title: input.title ?? undefined,
            },
          },
        },
      });
    },
  });
});
