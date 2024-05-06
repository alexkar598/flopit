import { builder } from "../../../builder.ts";
import { basePostRef } from "../basepost/schema.ts";

export const commentRef = builder.prismaNode("Post", {
  variant: "Comment",
  id: { field: "id" },
  interfaces: [basePostRef],
  select: {
    parent_id: true,
  },
  fields: (t) => ({
    parent: t.relation("Parent"),
  }),
});
