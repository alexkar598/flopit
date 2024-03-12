import { builder } from "../../../../builder.ts";
import { prisma } from "../../../../db.ts";
import { topPostRef } from "../schema.ts";
import { getAPIError } from "../../../../util.ts";
import { deltaValidator, quillDeltaToPlainText } from "../../delta.ts";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const input = builder.inputType("CreatePostInput", {
  fields: (t) => ({
    title: t.string(),
    sub: t.string(),
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

      if (!input.title.length) throw getAPIError("TITLE_TOO_SHORT");

      const delta = await deltaValidator.safeParseAsync(input.delta_content);
      if (!delta.success) throw getAPIError("INVALID_DELTA");

      try {
        return await prisma.post.create({
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
              connect: { name: input.sub },
            },
            delta_content: delta.data,
            text_content: quillDeltaToPlainText(delta.data),
            cached_votes: 0,
          },
        });
      } catch (e) {
        if (!(e instanceof PrismaClientKnownRequestError)) throw e;

        if (
          e.code === "P2025" &&
          (<string | undefined>e.meta?.cause)?.endsWith("'PostToSub'.")
        )
          throw getAPIError("SUB_NOT_FOUND");
        else throw e;
      }
    },
  }),
);
