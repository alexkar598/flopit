import { builder } from ".././../../builder.ts";
import { userRef } from "../../user/schema.ts";
import { Message, messageRef } from "../schema.ts";
import { getAPIError } from "../../../util.ts";
import { prisma } from "../../../db.ts";
import { createRedisClient } from "../../../redis.ts";
import { getConversationId } from "../util.ts";

const input = builder.inputType("SendMessageInput", {
  fields: (t) => ({
    target: t.globalID({ for: userRef }),
    text_content: t.string(),
  }),
});

builder.mutationField("sendMessage", (t) =>
  t.field({
    type: messageRef,
    nullable: true,
    args: {
      input: t.arg({ type: input }),
    },
    resolve: async (_root, { input }, { authenticated_user_id }) => {
      if (!authenticated_user_id) throw getAPIError("AUTHENTICATED_MUTATION");

      if (authenticated_user_id === input.target.id)
        throw getAPIError("MESSAGE_SELF");

      if (!(await prisma.user.findUnique({ where: { id: input.target.id } })))
        throw getAPIError("USER_NOT_FOUND");

      async function redisWork() {
        const message: Omit<Message, "id"> = {
          author_id: authenticated_user_id,
          target_id: input.target.id,
          textContent: input.text_content,
        };

        const conversationId = getConversationId(
          authenticated_user_id,
          input.target.id,
        );

        const redis = await createRedisClient();

        const id = await redis.xAdd(conversationId, "*", message);

        void redis.disconnect();

        return {
          id,
          ...message,
        } as Message;
      }

      function dbWork() {
        const owner_id_target_id1 = {
          owner_id: authenticated_user_id,
          target_id: input.target.id,
        };
        const owner_id_target_id2 = {
          owner_id: input.target.id,
          target_id: authenticated_user_id,
        };

        return prisma.$transaction((tx) =>
          Promise.all([
            tx.conversation.upsert({
              where: {
                owner_id_target_id: owner_id_target_id1,
              },
              update: { last_interact: new Date() },
              create: owner_id_target_id1,
            }),
            tx.conversation.upsert({
              where: {
                owner_id_target_id: owner_id_target_id2,
              },
              update: { last_interact: new Date() },
              create: owner_id_target_id2,
            }),
          ]),
        );
      }

      const [message] = await Promise.all([redisWork()]);

      return message;
    },
  }),
);
