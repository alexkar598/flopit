import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { userRef } from "../../user/schema.ts";
import { getAPIError } from "../../../util.ts";

builder.mutationField("closeConversation", (t) =>
  t.field({
    type: "Void",
    nullable: true,
    args: {
      target: t.arg.globalID({ for: userRef }),
    },
    resolve: async (_parent, { target }, { authenticated_user_id }) => {
      if (!authenticated_user_id) throw getAPIError("AUTHENTICATED_FIELD");

      try {
        await prisma.conversation.delete({
          where: {
            owner_id_target_id: {
              owner_id: authenticated_user_id,
              target_id: target.id,
            },
          },
        });
      } catch {
        throw getAPIError("CONVERSATION_NOT_FOUND");
      }
    },
  }),
);
