import { $Enums } from "@prisma/client";
import { builder } from "./_builder.ts";
import { topPostRef } from "./post.ts";

const AttachmentTypeRef = builder.enumType($Enums.AttachmentType, {
  name: "AttachmentType",
});

export const attachmentRef = builder.prismaNode("Attachment", {
  id: { field: "top_post_id_order" },
  select: {},
  fields: (t) => ({
    // topPost: t.relation("TopPost"),
    order: t.exposeInt("order"),
    type: t.expose("type", {
      type: AttachmentTypeRef,
    }),
    content: t.exposeString("content"),
  }),
});
builder.prismaObjectField(topPostRef, "attachments", (t) =>
  t.field({
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
);
