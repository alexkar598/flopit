import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../db.ts";
import { DefaultArgs } from "@prisma/client/runtime/library";

export async function isBanned(
  userId: string,
  subId: string,
  prismaObj: Omit<
    PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  > = prisma,
): Promise<boolean> {
  return Boolean(
    await prismaObj.ban.findFirst({
      select: { id: true },
      where: {
        user_id: userId,
        sub_id: subId,
        expiry: { lte: new Date() },
      },
    }),
  );
}
