import { builder } from "../../../builder.ts";
import { conversationRef } from "../../conversation/schema.ts";

builder.prismaObjectField("User", "conversations", (t) =>
  t.relatedConnection("Conversations", {
    cursor: "owner_id_target_id",
    totalCount: true,
    type: conversationRef,
  }),
);
