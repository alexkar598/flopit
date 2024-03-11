import { builder } from "../../builder.ts";
import { throwException } from "../../util.ts";

export enum PostSortType {
  Hot,
  Top,
  New,
}

export const postSortTypeRef = builder.enumType(PostSortType, {
  name: "PostSortType",
});

export const postSortOptionsRef = builder.inputType("PostSortOptions", {
  fields: (t) => ({
    type: t.field({
      type: postSortTypeRef,
      required: false,
    }),
    after: t.field({
      type: "DateTime",
      required: false,
    }),
  }),
});

export function extractQueryOptions(
  sortOptions:
    | {
        type?: PostSortType | null;
        after?: Date | null;
      }
    | null
    | undefined,
  defaultSortType: PostSortType,
  defaultAfter?: Date,
) {
  const sortType = sortOptions?.type ?? defaultSortType;
  const after = sortOptions?.after ?? defaultAfter;

  const orderBy =
    sortType === PostSortType.Hot
      ? ({ hotness: "desc" } as const)
      : sortType === PostSortType.New
        ? ({ created_at: "desc" } as const)
        : sortType === PostSortType.Top
          ? ({ cached_votes: "desc" } as const)
          : throwException(new Error("SortType invalide"));
  const where = {
    ...(after != null && {
      created_at: { gt: after },
    }),
  };

  return { orderBy, where };
}
