import { builder } from "../../builder.js";

export const conversationRef = builder.prismaNode("Conversation", {
  id: { field: "owner_id_target_id" },
  select: {},
  fields: (t) => ({
    lastInteraction: t.expose("last_interact", {
      type: "DateTime",
    }),
    owner: t.relation("Owner"),
    target: t.relation("Target"),
  }),
});
