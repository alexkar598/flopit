import { PothosError } from "@pothos/core";
import { builder } from "./_builder.ts";

export enum VoteValue {
  Down = -1,
  Neutral = 0,
  Up = 1,
}
export const voteValueRef = builder.enumType(VoteValue, {
  name: "VoteValue",
});

const basePostRef = builder.prismaInterface("Post", {
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
        throw new PothosError("Not implemented");
      },
    }),
  }),
  resolveType: (basePost) =>
    basePost.parent_id != null ? "Comment" : "TopPost",
});

const commentRef = builder.prismaNode("Post", {
  variant: "Comment",
  id: { field: "id" },
  interfaces: [basePostRef],
  select: {
    parent_id: true,
  },
  fields: (t) => ({
    parent: t.relation("Parent", {
      nullable: true,
    }),
  }),
});

builder.prismaInterfaceField("Post", "children", (t) =>
  t.relatedConnection("Children", {
    cursor: "id",
    totalCount: true,
    type: commentRef,
  }),
);

export const topPostMetaRef = builder.prismaObject("TopPost", {
  name: "TopPostMeta",
  select: {},
  fields: (t) => ({
    title: t.exposeString("title"),
  }),
});

export const topPostRef = builder.prismaNode("Post", {
  variant: "TopPost",
  id: { field: "id" },
  interfaces: [basePostRef],
  select: {
    parent_id: true,
  },
  fields: (t) => ({
    meta: t.relation("TopPost"),
  }),
});

builder.prismaObjectField("Sub", "posts", (t) =>
  t.relatedConnection("Posts", {
    cursor: "id",
    totalCount: true,
    type: topPostRef,
    query: {
      where: {
        parent_id: null,
      },
    },
  }),
);
builder.prismaObjectField("User", "posts", (t) =>
  t.relatedConnection("Posts", {
    cursor: "id",
    totalCount: true,
    type: topPostRef,
    query: {
      where: {
        parent_id: null,
      },
    },
  }),
);
builder.prismaObjectField("User", "comments", (t) =>
  t.relatedConnection("Posts", {
    cursor: "id",
    totalCount: true,
    type: commentRef,
    query: {
      where: {
        parent_id: {
          not: null,
        },
      },
    },
  }),
);
