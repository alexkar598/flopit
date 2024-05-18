import { builder } from "../../../builder.ts";
import { prisma } from "../../../db.ts";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { getAPIError } from "../../../util.ts";

const input = builder.inputType("UnsubscribePushNotifications", {
  fields: (t) => ({
    endpoint: t.string(),
  }),
});

builder.mutationField("unsubscribePushNotifications", (t) =>
  t.withAuth({ authenticated: true }).int({
    nullable: true,
    args: { input: t.arg({ type: input }) },
    resolve: async (_root, { input }) => {
      try {
        const batch = await prisma.pushNotification.deleteMany({
          where: {
            endpoint: input.endpoint,
          },
        });

        return batch.count;
      } catch (e) {
        if (e instanceof PrismaClientKnownRequestError) {
          console.log(e.code, e.meta);
          //"An operation failed because it depends on one or more records that were required but not found. {cause}"
          if (e.code === "P2025")
            throw getAPIError("PUSH_NOTIFICATION_NOT_FOUND");
        }
        throw e;
      }
    },
  }),
);
