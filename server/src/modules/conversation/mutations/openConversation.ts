import { builder } from "../../../builder.ts";
import { userRef } from "../../user/schema.ts";
import { getAPIError } from "../../../util.ts";
import { prisma } from "../../../db.ts";
import { conversationRef } from "../schema.ts";

builder.mutationField("openConversation", (t) =>
  t.prismaField({
    type: conversationRef,
    nullable: true,
    args: {
      target: t.arg.globalID({ for: userRef }),
    },
    resolve: (query, _parent, { target }, { authenticated_user_id }) => {
      if (!authenticated_user_id) throw getAPIError("AUTHENTICATED_FIELD");

      const owner_id_target_id = {
        owner_id: authenticated_user_id,
        target_id: target.id,
      };

      return prisma.conversation.upsert({
        ...query,
        where: {
          owner_id_target_id,
        },
        update: {},
        create: owner_id_target_id,
      });
    },
  }),
);
