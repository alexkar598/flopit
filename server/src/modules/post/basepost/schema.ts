import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { topPostRef } from "../toppost/schema.ts";
import { signDeltaImages } from "../delta.ts";

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
    sub: t.relation("Sub"),
    author: t.relation("Author", {
      nullable: true,
    }),
    createdAt: t.expose("created_at", {
      type: "DateTime",
    }),
    textContent: t.exposeString("text_content"),
    deltaContent: t.field({
      select: {
        delta_content: true,
      },
      nullable: true,
      type: "JSON",
      resolve: ({ delta_content }) =>
        signDeltaImages(delta_content as any, {
          width: 1280,
          height: 1280,
          resizeMode: "fit",
        }),
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
        return (
          (
            await prisma.vote.findUnique({
              where: {
                user_id_post_id: {
                  user_id: authenticated_user_id!,
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

builder.prismaInterfaceField("Post", "topPost", (t) =>
  t.prismaField({
    type: topPostRef,
    select: { top_post_id: true },
    resolve: (query, { top_post_id }) =>
      prisma.post.findFirstOrThrow({
        ...query,
        where: { parent_id: null, top_post_id },
      }),
  }),
);
