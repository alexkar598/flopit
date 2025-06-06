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
    author: t.prismaField({
      type: userRef,
      nullable: true,
      resolve: (query, message) =>
        prisma.user.findUnique({
          ...query,
          where: { id: message.author_id },
        }),
    }),
    target: t.prismaField({
      type: userRef,
      nullable: true,
      resolve: (query, messsage) =>
        prisma.user.findUnique({
          where: { id: messsage.target_id },
        }),
    }),
  }),
});
