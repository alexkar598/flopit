import { builder } from "../../builder.ts";
import { userRef } from "../user/schema.ts";
import { prisma } from "../../db.ts";

export interface Message {
  id: string;
  author_id: string;
  target_id: string;
  textContent: string;
}

export const messageRef = builder.objectRef<Message>("Message");

export const MessageConnection = builder.connectionObject({
  type: messageRef,
  name: "MessageConnection",
});

messageRef.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    textContent: t.exposeString("textContent"),
    created: t.field({
      type: "DateTime",
      resolve: (message) => new Date(parseInt(message.id.split("-")[0])),
    }),
    author: t.field({
      type: userRef,
      resolve: (messsage) =>
        prisma.user.findUnique({
          where: { id: messsage.author_id },
        }),
    }),
    target: t.field({
      type: userRef,
      resolve: (messsage) =>
        prisma.user.findUnique({
          where: { id: messsage.target_id },
        }),
    }),
  }),
});
