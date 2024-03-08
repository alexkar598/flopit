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
      ignoreFollows: t.arg.boolean({ required: false }),
    },
    resolve: async (
      query,
      _,
      { sortOptions, ignoreFollows },
      { authenticated_user_id },
    ) => {
      const followedSubs: string[] = [];
      if (!ignoreFollows && authenticated_user_id != null) {
        followedSubs.push(
          ...(
            await prisma.follow.findMany({
              select: {
                sub_id: true,
              },
              where: {
                user_id: authenticated_user_id,
              },
            })
          ).map(({ sub_id }) => sub_id),
        );
      }

      const querySortOptions = extractQueryOptions(
        sortOptions,
        PostSortType.Hot,
      );
      return prisma.post.findMany({
        ...query,
        ...querySortOptions,
        where: {
          ...querySortOptions.where,
          ...(followedSubs.length > 0 && { sub_id: { in: followedSubs } }),
          parent_id: null,
        },
      });
    },
  }),
);
