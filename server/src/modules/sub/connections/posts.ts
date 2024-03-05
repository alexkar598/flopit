import { builder } from "../../../builder.ts";
import {
  extractQueryOptions,
  postSortOptionsRef,
  PostSortType,
} from "../../post/sortable.ts";
import { topPostRef } from "../../post/toppost/schema.ts";

builder.prismaObjectField("Sub", "posts", (t) =>
  t.relatedConnection("Posts", {
    cursor: "id",
    totalCount: true,
    type: topPostRef,
    args: {
      sortOptions: t.arg({ type: postSortOptionsRef, required: false }),
    },
    query: ({ sortOptions }) => {
      const querySortOptions = extractQueryOptions(
        sortOptions,
        PostSortType.Hot,
      );
      return {
        ...querySortOptions,
        where: {
          ...querySortOptions.where,
          parent_id: null,
        },
      };
    },
  }),
);
