import { $Enums } from "@prisma/client";
import { builder } from "../../builder.ts";
import { prisma } from "../../db.ts";
import { topPostRef } from "../post/toppost/schema.ts";

export const AttachmentTypeRef = builder.enumType($Enums.AttachmentType, {
  name: "AttachmentType",
});

export const attachmentRef = builder.prismaNode("Attachment", {
  id: { field: "top_post_id_order" },
  select: {},
  fields: (t) => ({
    order: t.exposeInt("order"),
    type: t.expose("type", {
      type: AttachmentTypeRef,
    }),
    content: t.exposeString("content"),
  }),
});

builder.prismaObjectField("Attachment", "topPost", (t) =>
  t.prismaField({
    select: {
      top_post_id: true,
    },
    type: topPostRef,
    resolve: (query, { top_post_id }) =>
      prisma.post.findFirstOrThrow({
        ...query,
        where: {
          parent_id: null,
          top_post_id,
        },
      }),
  }),
);
