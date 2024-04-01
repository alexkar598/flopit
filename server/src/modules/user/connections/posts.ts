import { builder } from "../../../builder.ts";
import { topPostRef } from "../../post/toppost/schema.ts";

builder.prismaObjectField("User", "posts", (t) =>
  t.relatedConnection("Posts", {
    cursor: "id",
    totalCount: true,
    type: topPostRef,
    query: {
      where: {
        parent_id: null,
      },
    },
  }),
);
