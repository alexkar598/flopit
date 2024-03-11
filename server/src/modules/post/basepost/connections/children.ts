import { builder } from "../../../../builder.ts";
import { commentRef } from "../../comment/schema.ts";
import {
  extractQueryOptions,
  postSortOptionsRef,
  PostSortType,
} from "../../sortable.ts";

builder.prismaInterfaceField("Post", "children", (t) =>
  t.relatedConnection("Children", {
    cursor: "id",
    totalCount: true,
    type: commentRef,
    args: {
      sortOptions: t.arg({ type: postSortOptionsRef, required: false }),
    },
    query: ({ sortOptions }) => {
      const querySortOptions = extractQueryOptions(
        sortOptions,
        PostSortType.Top,
      );
      return {
        ...querySortOptions,
      };
    },
  }),
);
