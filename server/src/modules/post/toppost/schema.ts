import { builder } from "../../../builder.ts";
import { attachmentRef } from "../../attachment/schema.ts";
import { basePostRef } from "../basepost/schema.ts";

export const topPostRef = builder.prismaNode("Post", {
  variant: "TopPost",
  id: { field: "id" },
  interfaces: [basePostRef],
  select: {
    parent_id: true,
  },
  fields: (t) => ({
    title: t.string({
      select: {
        TopPost: {
          select: {
            title: true,
          },
        },
      },
      resolve: (parent) => parent.TopPost.title,
    }),
    attachments: t.field({
      select: (args, ctx, nestedSelection) => ({
        TopPost: {
          select: {
            Attachments: nestedSelection({}, []),
          },
        },
      }),
      type: [attachmentRef],
      resolve: (topPost) => topPost.TopPost.Attachments,
    }),
  }),
});
