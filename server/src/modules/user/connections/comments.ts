import { builder } from "../../../builder.ts";
import { commentRef } from "../../post/comment/schema.ts";

builder.prismaObjectField("User", "comments", (t) =>
  t.relatedConnection("Posts", {
    cursor: "id",
    totalCount: true,
    type: commentRef,
    query: {
      where: {
        parent_id: {
          not: null,
        },
      },
    },
  }),
);
