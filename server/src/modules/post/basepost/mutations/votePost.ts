import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { builder } from "../../../../builder.ts";
import { prisma } from "../../../../db.ts";
import { getAPIError, throwException } from "../../../../util.ts";
import { commentRef } from "../../comment/schema.ts";
import { topPostRef } from "../../toppost/schema.ts";
import { VoteValue, voteValueRef } from "../schema.ts";

const input = builder.inputType("VotePostInput", {
  fields: (t) => ({
    postId: t.globalID({
      for: [topPostRef, commentRef],
    }),
    value: t.field({
      type: voteValueRef,
    }),
  }),
});

builder.mutationField("votePost", (t) =>
  t.prismaField({
    type: "Post",
    nullable: true,
    args: { input: t.arg({ type: input }) },
    resolve: async (
      query,
      _,
      {
        input: {
          postId: { id: post_id },
          value: new_value,
        },
      },
      { authenticated_user_id },
    ) => {
      if (authenticated_user_id == null)
        throw getAPIError("AUTHENTICATED_MUTATION");

      return prisma.$transaction(async (tx) => {
        const current_value =
          (
            await tx.vote.findUnique({
              select: { value: true },
              where: {
                user_id_post_id: { user_id: authenticated_user_id, post_id },
              },
            })
          )?.value ?? 0;

        if (current_value === new_value) return selectPost();

        const difference = new_value - current_value;

        if (new_value === VoteValue.Neutral) {
          await tx.vote.delete({
            where: {
              user_id_post_id: {
                user_id: authenticated_user_id,
                post_id,
              },
            },
          });
        } else {
          try {
            await tx.vote.upsert({
              where: {
                user_id_post_id: {
                  user_id: authenticated_user_id,
                  post_id,
                },
              },
              update: { value: new_value },
              create: {
                user_id: authenticated_user_id,
                post_id,
                value: new_value,
              },
            });
          } catch (e) {
            if (e instanceof PrismaClientKnownRequestError) {
              console.log(e);
              //"Foreign key constraint failed on the field: {field_name}"
              if (e.code === "P2003" && e.meta?.field_name === "post_id")
                throw getAPIError("POST_NOT_FOUND");
            }
            throw e;
          }
        }

        await tx.post.update({
          where: {
            id: post_id,
          },
          data: {
            cached_votes: {
              increment: difference,
            },
          },
          select: {
            id: true,
          },
        });

        return selectPost();

        async function selectPost() {
          return (
            (await tx.post.findUnique({
              ...query,
              where: {
                id: post_id,
              },
            })) ?? throwException(getAPIError("POST_NOT_FOUND"))
          );
        }
      });
    },
  }),
);
