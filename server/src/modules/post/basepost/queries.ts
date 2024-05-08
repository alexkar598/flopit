import { z } from "zod";
import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { Prisma } from ".prisma/client";

enum SearchPostsType {
  TopPost,
  Comment,
}

export const searchPostsTypeRef = builder.enumType(SearchPostsType, {
  name: "SearchPostsType",
});

const input = builder.inputType("SearchPostsInput", {
  fields: (t) => ({
    query: t.string({
      validate: {
        schema: z.string().trim().min(1, "Recherche doit avoir 1 charactère"),
      },
      description: "fulltext",
    }),
    include: t.field({
      type: [searchPostsTypeRef],
      defaultValue: [SearchPostsType.TopPost, SearchPostsType.TopPost],
    }),
  }),
});

const FALSE = {
  AND: [{ parent_id: null }, { parent_id: { not: null } }],
};

function resolveWhere(
  include: SearchPostsType[],
  query: string,
): Prisma.PostWhereInput {
  include = [...new Set(include)];
  const typeConditions: Prisma.PostWhereInput[] = [FALSE];
  const searchConditions: Prisma.PostWhereInput[] = [
    { text_content: { search: query } },
  ];

  for (const type of include)
    switch (type) {
      case SearchPostsType.Comment:
        typeConditions.push({ parent_id: { not: null } });
        break;
      case SearchPostsType.TopPost:
        typeConditions.push({ parent_id: null });
        searchConditions.push({ TopPost: { title: { search: query } } });
        break;
    }

  return { AND: [{ OR: typeConditions }, { OR: searchConditions }] };
}

builder.queryField("searchPosts", (t) =>
  t.prismaConnection({
    type: "Post",
    cursor: "id",
    args: {
      input: t.arg({ type: input }),
    },
    totalCount: (_, { input: { query, include } }) =>
      prisma.post.count({
        where: resolveWhere(include, query),
      }),
    resolve: (query, _, { input: { query: search_query, include } }) =>
      prisma.post.findMany({
        ...query,
        where: resolveWhere(include, search_query),
        orderBy: {
          _relevance: {
            fields: ["text_content"],
            search: search_query,
            sort: "desc",
          },
        },
      }),
  }),
);
