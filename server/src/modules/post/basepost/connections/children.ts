import { builder } from "../../../../builder.ts";
import { commentRef } from "../../comment/schema.ts";

builder.prismaInterfaceField("Post", "children", (t) =>
  t.relatedConnection("Children", {
    cursor: "id",
    totalCount: true,
    type: commentRef,
  }),
);
