import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import {
  extractQueryOptions,
  postSortOptionsRef,
  PostSortType,
} from "../sortable.ts";
import { topPostRef } from "./schema.ts";

builder.queryField("homefeed", (t) =>
  t.prismaConnection({
    type: topPostRef,
    cursor: "id",
    args: {
      sortOptions: t.arg({ type: postSortOptionsRef, required: false }),
    },
    resolve: (query, _, { sortOptions }) => {
      const querySortOptions = extractQueryOptions(
        sortOptions,
        PostSortType.Hot,
      );
      return prisma.post.findMany({
        ...query,
        ...querySortOptions,
        where: {
          ...querySortOptions.where,
          parent_id: null,
        },
      });
    },
  }),
);
