import { builder } from ".././../../builder.ts";
import { userRef } from "../../user/schema.ts";
import { Message, messageRef } from "../schema.ts";
import { getAPIError } from "../../../util.ts";
import { prisma } from "../../../db.ts";
import { createRedisClient } from "../../../redis.ts";

const input = builder.inputType("SendMessageInput", {
  fields: (t) => ({
    receiver: t.globalID({ for: userRef }),
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
    resolve: async (root, { input }, { authenticated_user_id }) => {
      if (!authenticated_user_id) throw getAPIError("AUTHENTICATED_MUTATION");

      if (authenticated_user_id === input.receiver.id)
        throw getAPIError("MESSAGE_SELF");

      if (!(await prisma.user.findUnique({ where: { id: input.receiver.id } })))
        throw getAPIError("USER_NOT_FOUND");

      const message: Omit<Message, "id"> = {
        author_id: authenticated_user_id,
        receiver_id: input.receiver.id,
        created: new Date().toISOString(),
        textContent: input.text_content,
      };

      const conversationId = [input.receiver.id, authenticated_user_id]
        .sort()
        .join(":");

      const redis = await createRedisClient();

      const id = await redis.xAdd(conversationId, "*", message);

      return {
        id,
        ...message,
      } as Message;
    },
  }),
);
