import { builder } from "../../../../builder.ts";
import { prisma } from "../../../../db.ts";
import { subRef } from "../../../sub/schema.ts";
import { topPostRef } from "../schema.ts";
import { getAPIError } from "../../../../util.ts";
import { Delta, quillDeltaToPlainText } from "../../delta.ts";
import { z } from "zod";

const input = builder.inputType("CreatePostInput", {
  fields: (t) => ({
    title: t.string(),
    sub: t.globalID({
      for: subRef,
    }),
    delta_content: t.field({ type: "JSON" }),
  }),
});

builder.mutationField("createPost", (t) =>
  t.prismaField({
    type: topPostRef,
    nullable: true,
    args: { input: t.arg({ type: input }) },
    resolve: async (query, _root, { input }, { authenticated_user_id }) => {
      const delta = Delta.safeParse(input.delta_content);

      if (!delta.success) throw getAPIError("INVALID_DELTA");

      return prisma.post.create({
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
            connect: { id: input.sub.id },
          },
          delta_content: <any>delta.data,
          text_content: quillDeltaToPlainText(delta.data),
          cached_votes: 0,
        },
      });
    },
  }),
);
