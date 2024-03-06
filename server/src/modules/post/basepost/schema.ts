import { builder } from "../../../builder.ts";
import { getAPIError } from "../../../util.ts";

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
      type: voteValueRef,
      resolve: () => {
        throw getAPIError("NOT_IMPLEMENTED");
      },
    }),
  }),
  resolveType: (basePost) =>
    basePost.parent_id != null ? "Comment" : "TopPost",
});
