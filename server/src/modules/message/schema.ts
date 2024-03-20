import { builder } from "../../builder.ts";
import { userRef } from "../user/schema.ts";
import { prisma } from "../../db.ts";

export interface Message {
  id: string;
  author_id: string;
  receiver_id: string;
  textContent: string;
  created: string;
}

export const messageRef = builder.objectRef<Message>("Message");

messageRef.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    textContent: t.exposeString("textContent"),
    created: t.exposeString("created"),
    author: t.field({
      type: userRef,
      resolve: (messsage) =>
        prisma.user.findUnique({
          where: { id: messsage.author_id },
        }),
    }),
    receiver: t.field({
      type: userRef,
      resolve: (messsage) =>
        prisma.user.findUnique({
          where: { id: messsage.receiver_id },
        }),
    }),
  }),
});
