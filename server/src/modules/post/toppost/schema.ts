import { builder } from "../../../builder.ts";
import { basePostRef } from "../basepost/schema.ts";

export const topPostMetaRef = builder.prismaObject("TopPost", {
  name: "TopPostMeta",
  select: {},
  fields: (t) => ({
    title: t.exposeString("title"),
    attachments: t.relation("Attachments"),
  }),
});

export const topPostRef = builder.prismaNode("Post", {
  variant: "TopPost",
  id: { field: "id" },
  interfaces: [basePostRef],
  select: {
    parent_id: true,
  },
  fields: (t) => ({
    meta: t.relation("TopPost"),
  }),
});
