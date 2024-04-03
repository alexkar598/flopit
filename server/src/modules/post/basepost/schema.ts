import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { getAPIError, slugify, SlugType } from "../../../util.ts";

export enum VoteValue {
  Down = -1,
  Neutral = 0,
  Up = 1,
}
export const voteValueRef = builder.enumType(VoteValue, {
  name: "VoteValue",
});

export const basePostRef = builder.prismaInterface("Post", {
  name: "BasePost",
  select: {
    parent_id: true,
  },
  fields: (t) => ({
    id: t.exposeID("id"),
    slug: t.string({
      select: {
        id: true,
        parent_id: true,
      },
      resolve: ({ id, parent_id }) =>
        slugify(id, parent_id == null ? SlugType.TopPost : SlugType.Comment),
    }),
    sub: t.relation("Sub"),
    author: t.relation("Author", {
      nullable: true,
    }),
    createdAt: t.expose("created_at", {
      type: "DateTime",
    }),
    textContent: t.exposeString("text_content"),
    deltaContent: t.expose("delta_content", {
      type: "JSON",
    }),
    cachedVotes: t.expose("cached_votes", {
      type: "BigInt",
    }),
    currentVote: t.field({
      select: {
        id: true,
      },
      nullable: true,
      type: voteValueRef,
      resolve: async ({ id: post_id }, _args, { authenticated_user_id }) => {
        if (authenticated_user_id == null)
          throw getAPIError("AUTHENTICATED_FIELD");

        return (
          (
            await prisma.vote.findUnique({
              where: {
                user_id_post_id: {
                  user_id: authenticated_user_id,
                  post_id,
                },
              },
              select: {
                value: true,
              },
            })
          )?.value ?? VoteValue.Neutral
        );
      },
    }),
  }),
  resolveType: (basePost) =>
    basePost.parent_id != null ? "Comment" : "TopPost",
});
